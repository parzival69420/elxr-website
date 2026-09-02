import { thesis } from "@/lib/content";

export default function Thesis() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-28 text-center md:py-40">
      <p className="text-2xl font-medium leading-snug text-text/85 md:text-4xl">
        {thesis.lineOne}
        <br />
        <span className="font-black text-lavender">{thesis.emphasis}</span>{" "}
        {thesis.lineTwo}
      </p>
    </section>
  );
}
