import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Cpu, ShieldCheck, Wifi, Image as ImageIcon, HelpCircle } from "lucide-react";

const FAQS = [
  {
    icon: Cpu,
    iconBg: "bg-[#312E81]/8 border-[#312E81]/20",
    iconColor: "text-[#312E81]",
    q: "How does client-side processing work?",
    a: "Luxor PDF uses WebAssembly (WASM) to run complex PDF manipulation algorithms directly inside your web browser. When you select a file to split, merge, or convert, the file is read into your device's memory, processed by the WASM engine, and downloaded back to your hard drive. The file data never leaves your computer.",
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-[#FB7185]/10 border-[#FB7185]/25",
    iconColor: "text-[#E11D48]",
    q: "How is the PDF Expiry feature enforced?",
    a: "Unlike the standard tools, the Expiry feature does require uploading the document to our secure server, because we need to host it for sharing. When the expiry date passes, the server immediately and permanently overwrites the file with corrupted data. Anyone attempting to download it via the shared link will receive an unreadable file.",
  },
  {
    icon: Wifi,
    iconBg: "bg-[#2563EB]/10 border-[#2563EB]/25",
    iconColor: "text-[#2563EB]",
    q: "Do I need an internet connection for the Windows app?",
    a: "No. The Windows desktop application is completely self-contained. It requires no internet connection to function (except for the initial download). This makes it ideal for air-gapped environments or processing highly sensitive documents while offline. The Expiry feature, however, requires an internet connection to generate the shareable link.",
  },
  {
    icon: ImageIcon,
    iconBg: "bg-[#312E81]/8 border-[#312E81]/20",
    iconColor: "text-[#312E81]",
    q: "What image formats are supported for conversion?",
    a: "We currently support JPG, PNG, WEBP, GIF, and BMP. You can convert these formats to PDF, or extract pages from a PDF into these image formats.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#312E81]/5 border border-[#312E81]/15 text-[#312E81] text-xs font-medium mb-5">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4 tracking-[-0.02em]">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-600">Everything you need to know about the product and security.</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {FAQS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <AccordionItem
                value={`item-${i}`}
                className="group rounded-xl border border-slate-200 bg-white hover:border-[#312E81]/25 hover:shadow-md hover:shadow-slate-900/5 transition-all duration-200 px-5 data-[state=open]:border-[#312E81]/30 data-[state=open]:shadow-md data-[state=open]:bg-gradient-to-br data-[state=open]:from-[#EEF2FF]/40 data-[state=open]:to-white"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-medium hover:no-underline py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] ${item.iconBg}`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} strokeWidth={2.2} />
                    </div>
                    <span className="text-slate-900">{item.q}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-base pl-[3.25rem] pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
