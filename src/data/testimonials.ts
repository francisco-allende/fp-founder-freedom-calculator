// Verbatim from paretotalent.com/wall-of-love (SPEC §6). Do not edit the wording.

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote: 'My executive assistant Marina came from Pareto Talent and is just a world-beater. The best EA I have ever had.',
    name: 'Justin Donald',
    title: 'Founder of Lifestyle Investor',
  },
  {
    quote:
      'My executive assistant runs point on critical projects and keeps track of so many endless opportunities. I recommend them on a frequent basis.',
    name: 'Joe Polish',
    title: 'Founder of Genius Network',
  },
  {
    quote:
      "I just can't even imagine not having my EA right now. I can't fathom a world where she's not a big part of it.",
    name: 'Jon Vroman',
    title: 'Founder of Front Row Dads',
  },
  {
    quote:
      "Mariela is doing wonderful! It's only day 2 and I am already feeling such a relief that I have her during this crucial time in my business. She is eager, learns fast, and is accurate. I know it's early but I can already tell this was a great decision.",
    name: 'Daneen Goncalves',
    title: "matched to Mariela, September '25",
  },
  {
    quote:
      "I've had three different executive assistants before, and I thought it was me, right? I was burning through them. They just weren't up to the task. I think I really connected with Agustina, she has a lot of creativity, able to be the self-starter as well. She's not afraid to take things on and figure them out with guidance, which is really helpful.",
    name: 'Eric Ritter',
    title: 'matched to Agustina',
  },
  {
    quote: "I'm so happy with the decision, I can't imagine going back to like pre-Paula, or pre-an EA.",
    name: 'Bo Royal',
    title: 'matched to Paula',
  },
];
