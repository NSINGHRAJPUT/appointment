import {
  Mail,
  MapPin,
  MessageSquarePlus,
  SendHorizontal,
  Siren,
} from "lucide-react";

export default function ContactPage() {
  return (
    <>
      {/* Main Content Canvas */}
      <main className="max-w-container-max mx-auto px-margin py-xl min-h-[calc(100vh-64px)] flex flex-col justify-center relative overflow-hidden">
        {/* Subtle Background Decoration */}
        <div className=" mb-xl">
          <h1 className="font-display text-display text-on-surface mb-sm">
            Get in Touch
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Whether you have a question about our services, need to schedule a
            consultation, or require urgent support, our team is ready to assist
            you.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Form Section */}
          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg custom-shadow-hover transition-shadow duration-300">
            <h2 className="font-h3 text-h3 text-on-surface mb-md">
              Send a Message
            </h2>
            <form className="space-y-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant mb-xs block"
                    htmlFor="first_name"
                  >
                    First Name
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
                    id="first_name"
                    placeholder="Jane"
                    type="text"
                  />
                </div>
                <div>
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant mb-xs block"
                    htmlFor="last_name"
                  >
                    Last Name
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
                    id="last_name"
                    placeholder="Doe"
                    type="text"
                  />
                </div>
              </div>
              <div>
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant mb-xs block"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
                  id="email"
                  placeholder="jane@example.com"
                  type="email"
                />
              </div>
              <div>
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant mb-xs block"
                  htmlFor="topic"
                >
                  Topic
                </label>
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                  id="topic"
                >
                  <option>General Inquiry</option>
                  <option>Scheduling</option>
                  <option>Billing &amp; Insurance</option>
                  <option>Technical Support</option>
                </select>
              </div>
              <div>
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant mb-xs block"
                  htmlFor="message"
                >
                  Message
                </label>
                <textarea
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all resize-none"
                  id="message"
                  placeholder="How can we help you?"
                  rows={4}
                ></textarea>
              </div>
              <div className="pt-sm">
                <button
                  className="bg-primary text-on-primary font-label-sm text-label-sm px-lg py-3 rounded-lg hover:bg-surface-tint transition-colors w-full sm:w-auto inline-flex justify-center items-center gap-xs float-end"
                  type="button"
                >
                  Send Message
                  <span className="material-symbols-outlined text-[16px]">
                    <SendHorizontal size={14} />
                  </span>
                </button>
              </div>
            </form>
          </div>
          {/* Info Bento Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-md">
            {/* Urgent Support Highlight Card */}
            <div className="sm:col-span-2 lg:col-span-1 bg-surface-container-low border border-outline-variant rounded-xl p-lg flex items-start gap-md custom-shadow-hover transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill">
                  <Siren />
                </span>
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">
                  Urgent Support
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
                  For immediate assistance during non-business hours, please
                  reach out via our dedicated line.
                </p>
                <a
                  className="inline-flex items-center gap-xs font-label-sm text-label-sm text-primary hover:text-surface-tint transition-colors"
                  href="/communication"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    <MessageSquarePlus />
                  </span>
                  Message on WhatsApp
                </a>
              </div>
            </div>
            {/* Email Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md custom-shadow-hover transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">
                  <Mail />
                </span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">
                  Support Email
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium">
                  support@luminahealth.com
                </p>
              </div>
            </div>
            {/* Office Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-start gap-md custom-shadow-hover transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">
                  <MapPin />
                </span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">
                  Headquarters
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium mb-xs">
                  100 Innovation Drive
                  <br />
                  Suite 400
                  <br />
                  San Francisco, CA 94103
                </p>
                <a
                  className="font-label-sm text-label-sm text-primary hover:underline underline-offset-4"
                  href="/contact"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
