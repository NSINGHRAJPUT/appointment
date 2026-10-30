import { Heart, PawPrint, Stethoscope } from "lucide-react";

const FLOATERS = [
  {
    icon: PawPrint,
    className:
      "top-[8%] left-[4%] h-14 w-14 text-primary/20 animate-float-slow animate-float-delay-1",
    size: 28,
  },
  {
    icon: Heart,
    className:
      "top-[22%] right-[6%] h-12 w-12 text-tertiary/30 animate-float-reverse animate-float-delay-2",
    size: 22,
  },
  {
    icon: Stethoscope,
    className:
      "top-[48%] left-[2%] h-11 w-11 text-secondary/15 animate-drift animate-float-delay-3 hidden md:flex",
    size: 20,
  },
  {
    icon: PawPrint,
    className:
      "top-[62%] right-[4%] h-16 w-16 text-primary/15 animate-bob-spin animate-float-delay-4 hidden lg:flex",
    size: 30,
  },
  {
    icon: Heart,
    className:
      "bottom-[18%] left-[8%] h-10 w-10 text-primary/20 animate-float animate-float-delay-2 hidden md:flex",
    size: 18,
  },
  {
    icon: PawPrint,
    className:
      "bottom-[8%] right-[10%] h-12 w-12 text-secondary/20 animate-float-slow hidden sm:flex",
    size: 24,
  },
];

export default function HomeFloatingDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden -z-[1]"
      aria-hidden
    >
      {FLOATERS.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`absolute items-center justify-center rounded-full bg-white/40 backdrop-blur-sm border border-primary/10 shadow-sm flex ${item.className}`}
          >
            <Icon size={item.size} strokeWidth={1.5} />
          </div>
        );
      })}
    </div>
  );
}
