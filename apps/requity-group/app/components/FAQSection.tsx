"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`faq-item${isOpen ? " faq-item-open" : ""}`}>
      <button
        type="button"
        className="faq-question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{faq.question}</span>
        <ChevronDown size={18} className={`faq-chevron${isOpen ? " faq-chevron-open" : ""}`} />
      </button>
      <div className={`faq-answer${isOpen ? " faq-answer-open" : ""}`}>
        <p>{faq.answer}</p>
      </div>
    </div>
  );
}

export default function FAQSection({
  faqs,
  label = "FAQ",
  heading = "Frequently asked questions",
}: {
  faqs: FAQ[];
  label?: string;
  heading?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-section">
      {faqs.map((faq, i) => (
        <FAQItem
          key={i}
          faq={faq}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
