import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Everything you need to know about the product and security.</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left text-lg font-medium">How does client-side processing work?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-base">
              Luxor PDF uses WebAssembly (WASM) to run complex PDF manipulation algorithms directly inside your web browser. When you select a file to split, merge, or convert, the file is read into your device's memory, processed by the WASM engine, and downloaded back to your hard drive. The file data never leaves your computer.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left text-lg font-medium">How is the PDF Expiry feature enforced?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-base">
              Unlike the standard tools, the Expiry feature *does* require uploading the document to our secure server, because we need to host it for sharing. When the expiry date passes, the server immediately and permanently overwrites the file with corrupted data. Anyone attempting to download it via the shared link will receive an unreadable file.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left text-lg font-medium">Do I need an internet connection for the Windows app?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-base">
              No. The Windows desktop application is completely self-contained. It requires no internet connection to function (except for the initial download). This makes it ideal for air-gapped environments or processing highly sensitive documents while offline. The Expiry feature, however, requires an internet connection to generate the shareable link.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left text-lg font-medium">What image formats are supported for conversion?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-base">
              We currently support JPG, PNG, WEBP, GIF, and BMP. You can convert these formats to PDF, or extract pages from a PDF into these image formats.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
