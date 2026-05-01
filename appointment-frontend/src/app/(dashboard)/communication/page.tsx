export default function CommunicationPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-container-max px-8 py-margin">
        <section className="flex min-h-[70vh] flex-col rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),_0_2px_4px_-2px_rgba(0,0,0,0.02)] overflow-hidden">
{/* Message History */}
          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 bg-surface-bright">
            {/* Date Divider */}
            <div className="flex items-center justify-center">
              <span className="text-label-xs font-label-xs text-outline bg-surface-container px-3 py-1 rounded-full uppercase tracking-widest">
                Today
              </span>
            </div>
            {/* Received Message */}
            <div className="flex items-end gap-3 max-w-[80%]">
              <img
                alt="Dr. Sarah Jenkins"
                className="w-8 h-8 rounded-full object-cover mb-1"
                data-alt="Portrait of a female doctor in a white coat looking approachable"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6dQGKatAGWtbQ100bJyNlkT2bd9P9XSlZ__vz1aPSvQCYTBz4vmdTjh00UKMylr0a8Kv0cw1f3tP7U2VGTY7ClQrl4LZoWknwwSPGgfvE7GuQy4eYKD0iVaQbTNT-kz-cbsOZ0YPMd7yqEbFKShJfyLPQd6ZJhvEjyg8sq0TJN7YoNGwrAuvFLwma0M59LNfyuuXniRCwSaT0k5gs7uvy3dnc1K8I6DD8EpgnZ5lh0nXQTTo4eA5J7wUfec3LehtJXReHC08qmwzw"
              />
              <div className="flex flex-col gap-1">
                <div className="bg-surface border border-outline-variant p-4 rounded-2xl rounded-bl-none shadow-sm">
                  <p className="font-body-md text-body-md text-on-surface">
                    Hello! I've reviewed your recent test results. Everything
                    looks mostly normal, but I'd like to discuss your vitamin D
                    levels.
                  </p>
                </div>
                <span className="text-[10px] text-outline ml-1">10:40 AM</span>
              </div>
            </div>
            {/* Sent Message */}
            <div className="flex items-end gap-3 max-w-[80%] self-end flex-row-reverse">
              <div className="flex flex-col gap-1 items-end">
                <div className="bg-primary-container text-on-primary-container p-4 rounded-2xl rounded-br-none shadow-sm">
                  <p className="font-body-md text-body-md">
                    Thank you, Dr. Jenkins. Should I start taking a supplement?
                  </p>
                </div>
                <div className="flex items-center gap-1 mr-1">
                  <span className="text-[10px] text-outline">10:41 AM</span>
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    done_all
                  </span>
                </div>
              </div>
            </div>
            {/* Typing Indicator Bubble */}
            <div className="flex items-end gap-3 max-w-[80%]">
              <img
                alt="Dr. Sarah Jenkins"
                className="w-8 h-8 rounded-full object-cover mb-1 opacity-50"
                data-alt="Portrait of a female doctor in a white coat looking approachable"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8NzsYaLxM8M4UbbF__HCv2vo6oKWAMHE5KxemWGRRmxRTCu5slqntIaJjM3Bw8emUhMUtihMUCIGYDpNuBF_c8oUh1_7pic_uRC3bbJDiYgR7M4jXj_sjooBwNV3lry8Fb1WrUB8_k9yqWgMUw_AUrOZDOJyUeJlrhJkbRV1LC4tPR1X-VR9PTjpuOa87hhnwY0-0rhJZf12zhPxnUGD3ahCLBbyqDSNxujtrg30qRgSTh_iUdJ5-HikiIkKx8WWugpY8sfQJ2lYC"
              />
              <div className="bg-surface border border-outline-variant p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                <div
                  className="w-2 h-2 bg-outline-variant rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-outline-variant rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-outline-variant rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
          {/* Input Area */}
          <div className="p-4 bg-surface border-t border-outline-variant">
            <div className="flex items-end gap-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <button
                className="p-2 text-outline hover:text-primary transition-colors rounded-lg flex-shrink-0"
                title="Attach file"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <textarea
                className="flex-grow bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md max-h-32 min-h-[44px] py-3"
                placeholder="Type your message..."
                rows={1}
              ></textarea>
              <button
                className="p-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors flex-shrink-0 shadow-sm"
                title="Send"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  send
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
