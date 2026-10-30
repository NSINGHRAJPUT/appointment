"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { appointmentService } from "@/services/appointment.service";
import { authService } from "@/services/auth.service";
import { callService } from "@/services/call.service";
import { getStoredToken } from "@/hooks/use-auth";
import { env } from "@/lib/env";
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
  | { type: "candidate"; candidate: RTCIceCandidateInit };

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl p-6">
          <p className="text-sm text-on-surface-variant">Loading call…</p>
        </main>
      }
    >
      <CallPageInner />
    </Suspense>
  );
}

function CallPageInner() {
  const searchParams = useSearchParams();
  const appointmentFromUrl = searchParams.get("appointmentId");

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const confirmedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "CONFIRMED"),
    [appointments],
  );

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(appointmentFromUrl);
  const [callStatus, setCallStatus] = useState<string>(
    "Select a confirmed appointment",
  );
  const [callError, setCallError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remotePresent, setRemotePresent] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const makingOfferRef = useRef(false);
  const roleRef = useRef<UserRole | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    selectedIdRef.current = selectedAppointmentId;
  }, [selectedAppointmentId]);

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  useEffect(() => {
    if (appointmentFromUrl) {
      setSelectedAppointmentId(appointmentFromUrl);
    }
  }, [appointmentFromUrl]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      appointmentService.myAppointments(token),
      authService.me(token),
    ])
      .then(([data, me]) => {
        setAppointments(data as MyAppointment[]);
        const r = (me as { role?: UserRole }).role ?? null;
        setRole(r);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  function cleanupMedia() {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
    makingOfferRef.current = false;
  }

  function disconnectSocket() {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }

  useEffect(() => {
    return () => {
      const roomId = selectedIdRef.current;
      if (socketRef.current && roomId) {
        socketRef.current.emit("call:hangup", { roomId });
      }
      disconnectSocket();
      cleanupMedia();
    };
  }, []);

  async function flushPendingCandidates(pc: RTCPeerConnection) {
    for (const cand of pendingCandidatesRef.current.splice(0)) {
      try {
        await pc.addIceCandidate(cand);
      } catch {
        // ignore until remote description is ready
      }
    }
  }

  async function createAndSendOffer(socket: Socket, roomId: string) {
    const pc = pcRef.current;
    if (!pc || makingOfferRef.current) return;
    makingOfferRef.current = true;
    try {
      setCallStatus("Creating offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call:signal", {
        roomId,
        payload: { type: "offer", sdp: pc.localDescription },
      });
      setCallStatus("Waiting for answer...");
    } finally {
      makingOfferRef.current = false;
    }
  }

  async function handleSignal(
    socket: Socket,
    roomId: string,
    payload: SignalPayload,
    isOfferer: boolean,
  ) {
    const pc = pcRef.current;
    const type = payload?.type;

    if (type === "candidate" && !pc) {
      if ("candidate" in payload && payload.candidate) {
        pendingCandidatesRef.current.push(payload.candidate);
      }
      return;
    }
    if (!pc) return;

    if (type === "offer" && !isOfferer) {
      await pc.setRemoteDescription(payload.sdp);
      await flushPendingCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call:signal", {
        roomId,
        payload: { type: "answer", sdp: pc.localDescription },
      });
      setCallStatus("In call");
      setInCall(true);
    } else if (type === "answer" && isOfferer) {
      await pc.setRemoteDescription(payload.sdp);
      await flushPendingCandidates(pc);
      setCallStatus("In call");
      setInCall(true);
    } else if (type === "candidate") {
      if (!("candidate" in payload) || !payload.candidate) return;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(payload.candidate);
      } else {
        pendingCandidatesRef.current.push(payload.candidate);
      }
    }
  }

  async function startCall() {
    if (!token || !selectedAppointmentId || !role) return;
    if (role !== "DOCTOR" && role !== "PATIENT") {
      setCallError("Only doctor or patient can join the call");
      return;
    }

    setCalling(true);
    setCallError(null);
    setCallStatus("Initializing...");
    setRemotePresent(false);

    const isOfferer = role === "DOCTOR";
    const roomId = selectedAppointmentId;

    try {
      cleanupMedia();
      disconnectSocket();

      await callService.start(token, roomId, "VIDEO");
      setCallStatus("Fetching ICE servers...");
      const { iceServers } = await callService.getIceServers(token, roomId);

      setCallStatus("Connecting signaling...");
      const socket = io(`${env.wsUrl}/call`, {
        auth: { token },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      socket.on("disconnect", () => {
        setCallStatus("Disconnected");
        setInCall(false);
      });

      socket.on("call:signal", async (payload: SignalPayload) => {
        try {
          await handleSignal(socket, roomId, payload, isOfferer);
        } catch (e) {
          setCallError((e as Error).message);
        }
      });

      socket.on("peer:joined", async () => {
        setRemotePresent(true);
        setCallStatus("Peer joined");
        if (isOfferer) {
          try {
            await createAndSendOffer(socket, roomId);
          } catch (e) {
            setCallError((e as Error).message);
          }
        } else {
          setCallStatus("Waiting for offer...");
        }
      });

      socket.on("call:hangup", () => {
        setCallStatus("Peer left the call");
        setRemotePresent(false);
        setInCall(false);
        cleanupMedia();
      });

      await new Promise<void>((resolve, reject) => {
        socket.once("connect", () => resolve());
        socket.once("connect_error", (err) => reject(err));
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMicOn(true);
      setCamOn(true);

      const pc = new RTCPeerConnection({
        iceServers: iceServers as RTCIceServer[],
      });
      pcRef.current = pc;

      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      pc.ontrack = (ev) => {
        const [remoteStream] = ev.streams;
        if (remoteStream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setRemotePresent(true);
        setInCall(true);
        setCallStatus("In call");
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        socket.emit("call:signal", {
          roomId,
          payload: { type: "candidate", candidate: ev.candidate.toJSON() },
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallStatus("In call");
          setInCall(true);
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setCallStatus(`Connection ${pc.connectionState}`);
        }
      };

      socket.emit("call:join", { roomId });
      setCallStatus(
        isOfferer ? "Waiting for patient..." : "Waiting for doctor...",
      );
      setInCall(true);
    } catch (e) {
      setCallError((e as Error).message);
      setCallStatus("Failed");
      cleanupMedia();
      disconnectSocket();
      setInCall(false);
    } finally {
      setCalling(false);
    }
  }

  async function hangUp() {
    const roomId = selectedAppointmentId;
    if (socketRef.current && roomId) {
      socketRef.current.emit("call:hangup", { roomId });
    }
    if (token && roomId) {
      try {
        await callService.end(token, roomId);
      } catch {
        // session may already be ended
      }
    }
    cleanupMedia();
    disconnectSocket();
    setInCall(false);
    setRemotePresent(false);
    setCallStatus("Call ended");
  }

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }

  const selected = confirmedAppointments.find(
    (a) => a.id === selectedAppointmentId,
  );
  const peerLabel =
    role === "DOCTOR"
      ? selected?.patient?.user?.fullName ?? "Patient"
      : selected?.doctor?.user?.fullName ?? "Doctor";

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Video call</h1>
          <p className="text-sm text-on-surface-variant">
            1:1 doctor–patient consultation with secure TURN relay.
          </p>
        </div>
        <Badge tone="success">Video</Badge>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-error/10 border border-error/20 p-3 text-sm text-error">
          {error}
        </p>
      )}
      {callError && (
        <p className="mb-4 rounded-2xl bg-error/10 border border-error/20 p-3 text-sm text-error">
          {callError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="space-y-4 rounded-2xl border-outline-variant p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-on-surface">
              Eligible appointments
            </h2>
            <p className="text-xs text-on-surface-variant">
              Only confirmed appointments can start a call. Doctor creates the
              offer; patient answers.
            </p>
          </div>

          {loading && <p className="text-sm text-on-surface-variant">Loading…</p>}
          {!loading && confirmedAppointments.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No confirmed appointments yet.
            </p>
          )}

          {!loading &&
            confirmedAppointments.map((a) => {
              const title =
                role === "DOCTOR"
                  ? (a.patient?.user?.fullName ?? "Patient")
                  : (a.doctor?.user?.fullName ?? "Doctor");
              const isSelected = a.id === selectedAppointmentId;
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={inCall}
                  onClick={() => setSelectedAppointmentId(a.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary-container/40"
                      : "border-outline-variant hover:bg-surface-container-low"
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-on-surface">
                      {title}
                    </p>
                    <Badge tone={isSelected ? "success" : "neutral"}>
                      CONFIRMED
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {new Date(a.startAt).toLocaleString()}
                  </p>
                </button>
              );
            })}

          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3 text-sm">
            <p className="text-xs text-on-surface-variant">Status</p>
            <p className="font-medium text-on-surface">{callStatus}</p>
            {role && (
              <p className="mt-1 text-xs text-on-surface-variant">
                You are {role === "DOCTOR" ? "the doctor (offerer)" : "the patient"}
              </p>
            )}
          </div>

          {!inCall ? (
            <Button
              className="w-full"
              disabled={!selectedAppointmentId || calling || !role}
              loading={calling}
              onClick={() => void startCall()}
            >
              Join video call
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => void hangUp()}
            >
              End call
            </Button>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="relative overflow-hidden rounded-2xl border-outline-variant bg-on-surface p-0">
            <div className="relative aspect-video w-full bg-on-surface">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              {!remotePresent && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
                  Waiting for {peerLabel}…
                </div>
              )}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-white/20 object-cover shadow-lg"
              />
            </div>

            {inCall && (
              <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-on-surface px-4 py-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label={micOn ? "Mute" : "Unmute"}
                >
                  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={toggleCam}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                >
                  {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => void hangUp()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-error text-on-primary hover:opacity-90"
                  aria-label="Hang up"
                >
                  <PhoneOff size={18} />
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
