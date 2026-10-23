"use client";

import { useState, useEffect } from "react";
import { Folder, ChevronDown } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FaqProps {
  config: {
    variant?: string;
    title?: string;
    subtitle?: string;
    showCategories?: boolean;
    allowMultipleOpen?: boolean;
  };
  isPreview?: boolean;
}

export default function Faq({ config, isPreview = false }: FaqProps) {
  const variant = config.variant || "default";
  const allowMultiple = config.allowMultipleOpen === true;
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await fetch("/api/faq?published=true");
        if (res.ok) {
          const data = await res.json();
          setFaqs(data);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  const categories = Array.from(new Set(faqs.map((faq) => faq.category).filter((c): c is string => Boolean(c))));

  // Accordion variant
  if (variant === "accordion") {
    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? "py-12" : ""}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{config.title || "Pertanyaan Umum"}</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)
            ) : faqs.length > 0 ? (
              faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button onClick={() => toggleItem(faq.id)} className="w-full flex items-center justify-between p-6 text-left">
                    <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <span className={`text-indigo-600 text-2xl transition-transform ${openItems.has(faq.id) ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openItems.has(faq.id) && (
                    <div className="px-6 pb-6">
                      <div className="prose text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">❓</p>
                <p>Belum ada FAQ</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default variant with categories
  return (
    <section className={`py-20 bg-white ${isPreview ? "py-12" : ""}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{config.title || "Pertanyaan Umum"}</h2>
          {config.subtitle && <p className="text-xl text-gray-600 max-w-2xl mx-auto">{config.subtitle}</p>}
        </div>

        {loading ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : faqs.length > 0 ? (
          config.showCategories && categories.length > 0 ? (
            <div className="space-y-12">
              {categories.map((category) => {
                const categoryFaqs = faqs.filter((f) => f.category === category);
                return (
                  <div key={category}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Folder className="w-5 h-5" />
                      </div>
                      {category}
                    </h3>
                    <div className="space-y-4">
                      {categoryFaqs.map((faq) => (
                        <div key={faq.id} className="bg-gray-50 rounded-xl overflow-hidden">
                          <button onClick={() => toggleItem(faq.id)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 transition-colors">
                            <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                            <span className={`text-indigo-600 text-2xl transition-transform flex-shrink-0 ${openItems.has(faq.id) ? "rotate-45" : ""}`}>+</span>
                          </button>
                          {openItems.has(faq.id) && (
                            <div className="px-6 pb-6">
                              <div className="prose prose-indigo text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-gray-50 rounded-xl overflow-hidden">
                  <button onClick={() => toggleItem(faq.id)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 transition-colors">
                    <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <span className={`text-indigo-600 text-2xl transition-transform flex-shrink-0 ${openItems.has(faq.id) ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openItems.has(faq.id) && (
                    <div className="px-6 pb-6">
                      <div className="prose prose-indigo text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-6xl mb-4">❓</p>
            <p className="text-xl">Belum ada pertanyaan</p>
            <p className="text-sm mt-2">Pertanyaan umum akan muncul di sini</p>
          </div>
        )}
      </div>
    </section>
  );
}
