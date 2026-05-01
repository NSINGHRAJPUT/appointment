"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { appointmentService } from "@/services/appointment.service";
import { callService } from "@/services/call.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MyAppointment = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  doctor: { user?: { fullName?: string } };
  patient: { user?: { fullName?: string } };
  conversation?: { id: string };
};

type SignalPayload =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "candidate"; candidate: RTCIceCandidateInit }
  | unknown;

export default function CallPage() {
  const [token, setToken] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const confirmedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "CONFIRMED"),
    [appointments],
  );

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [mode, setMode] = useState<"caller" | "receiver">("caller");
  const [callStatus, setCallStatus] = useState<string>(
    "Select a confirmed appointment",
  );
  const [callError, setCallError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setToken(window.localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    appointmentService
      .myAppointments(token)
      .then((data) => setAppointments(data as MyAppointment[]))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      remoteStreamRef.current = null;
    };
  }, []);

  async function startCall() {
    if (!token || !selectedAppointmentId) return;
    setCalling(true);
    setCallError(null);
    setCallStatus("Initializing...");

    try {
      await callService.start(token, selectedAppointmentId);
      setCallStatus("Starting realtime signaling...");

      const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const socket = io(`${WS_URL}/call`, {
        auth: { token },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.on("disconnect", () => {
        setCallStatus("Disconnected");
      });

      socket.on("call:signal", async (payload: any) => {
        try {
          const type = payload?.type;
          if (type === "candidate" && !pcRef.current) {
            if (payload.candidate)
              pendingCandidatesRef.current.push(
                payload.candidate as RTCIceCandidateInit,
              );
            return;
          }
          if (!pcRef.current) return;
          if (type === "offer" && mode === "receiver") {
            await pcRef.current.setRemoteDescription(
              payload.sdp as RTCSessionDescriptionInit,
            );
            for (const cand of pendingCandidatesRef.current.splice(0)) {
              try {
                await pcRef.current.addIceCandidate(cand);
              } catch {
                // If remote description isn't ready, we'll keep waiting for the next update.
              }
            }
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socket.emit("call:signal", {
              roomId: selectedAppointmentId,
              payload: { type: "answer", sdp: pcRef.current.localDescription },
            });
          } else if (type === "answer" && mode === "caller") {
            await pcRef.current.setRemoteDescription(
              payload.sdp as RTCSessionDescriptionInit,
            );
            for (const cand of pendingCandidatesRef.current.splice(0)) {
              try {
                await pcRef.current.addIceCandidate(cand);
              } catch {
                // ignore until next remote description update
              }
            }
          } else if (type === "candidate") {
            if (!payload.candidate) return;
            const pc = pcRef.current;
            if (pc.remoteDescription) {
              await pc.addIceCandidate(
                payload.candidate as RTCIceCandidateInit,
              );
            } else {
              pendingCandidatesRef.current.push(
                payload.candidate as RTCIceCandidateInit,
              );
            }
          }
        } catch (e) {
          setCallError((e as Error).message);
        }
      });

      await new Promise<void>((resolve) => {
        socket.once("connect", () => resolve());
      });

      socket.emit("call:join", { roomId: selectedAppointmentId });

      const rtcConfig: RTCConfiguration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (stream) {
          remoteStreamRef.current = stream;
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
          }
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !selectedAppointmentId) return;
        socket.emit("call:signal", {
          roomId: selectedAppointmentId,
          payload: { type: "candidate", candidate: ev.candidate.toJSON() },
        });
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      for (const track of stream.getTracks()) pc.addTrack(track, stream);

      setCallStatus("Ready");

      if (mode === "caller") {
        setCallStatus("Creating offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:signal", {
          roomId: selectedAppointmentId,
          payload: { type: "offer", sdp: pc.localDescription },
        });
        setCallStatus("Waiting for answer...");
      } else {
        setCallStatus("Waiting for offer...");
      }
    } catch (e) {
      setCallError((e as Error).message);
      setCallStatus("Failed");
    } finally {
      setCalling(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Call</h1>
          <p className="text-sm text-zinc-600">
            Basic WebRTC audio call with secure backend signaling.
          </p>
        </div>
        <Badge tone="warning">MVP</Badge>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {callError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {callError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-900">
              Eligible appointments
            </h2>
            <p className="text-xs text-zinc-500">
              Only `CONFIRMED` appointments can start a call.
            </p>
          </div>

          {loading && <p className="text-sm text-zinc-500">Loading...</p>}
          {!loading && confirmedAppointments.length === 0 && (
            <p className="text-sm text-zinc-500">
              No confirmed appointments yet.
            </p>
          )}

          {!loading &&
            confirmedAppointments.map((a) => {
              const title =
                a.doctor?.user?.fullName ??
                a.patient?.user?.fullName ??
                "Appointment";
              const isSelected = a.id === selectedAppointmentId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAppointmentId(a.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {title}
                    </p>
                    <Badge tone={isSelected ? "success" : "neutral"}>
                      CONFIRMED
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(a.startAt).toLocaleString()}
                  </p>
                </button>
              );
            })}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-900">Mode</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === "caller" ? "primary" : "secondary"}
                onClick={() => setMode("caller")}
              >
                Caller
              </Button>
              <Button
                variant={mode === "receiver" ? "primary" : "secondary"}
                onClick={() => setMode("receiver")}
              >
                Receiver
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p className="text-xs text-zinc-500">Status</p>
            <p className="font-medium text-zinc-900">{callStatus}</p>
          </div>

          <Button
            className="w-full"
            disabled={!selectedAppointmentId || calling}
            loading={calling}
            onClick={() => void startCall()}
          >
            Start call
          </Button>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Audio</h2>
                <p className="text-xs text-zinc-500">
                  Permission prompt may appear in your browser.
                </p>
              </div>
              <Badge tone="neutral">STUN: Google</Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-500">Local</p>
                <audio ref={localAudioRef} autoPlay muted />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Remote</p>
                <audio ref={remoteAudioRef} autoPlay />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              How it works
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Caller creates an SDP offer and both peers exchange candidates via
              Socket.IO rooms keyed by the appointment ID.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
