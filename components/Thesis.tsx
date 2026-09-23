import { thesis } from "@/lib/content";

export default function Thesis() {
  return (
    <section id="thesis" className="thesis-section relative z-10">
      <p>
        {thesis.lineOne}
        <br />
        <span>{thesis.emphasis}</span>
      </p>
      <p>{thesis.lineTwo}</p>
    </section>
  );
}
