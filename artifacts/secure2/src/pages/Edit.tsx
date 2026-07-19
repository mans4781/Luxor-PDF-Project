import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  FilePenLine, Upload, FileText, Image as ImageIcon, FileSpreadsheet, 
  ArrowRightLeft, CheckCircle2, FileIcon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { canvasToBmpBlob } from '../lib/bmp-encode';
import { loadPreferences } from './Settings';

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ConversionType = 'pdf-to-img' | 'pdf-to-word' | 'pdf-to-excel' | 'img-to-pdf' | 'word-to-pdf' | 'excel-to-pdf';

type ImageDpi = 72 | 144 | 216;
type ImageFormat = 'png' | 'jpg' | 'webp' | 'bmp';

const DPI_OPTIONS: { value: ImageDpi; label: string; hint: string }[] = [
  { value: 72, label: 'Standard', hint: '72 DPI' },
  { value: 144, label: 'High', hint: '144 DPI' },
  { value: 216, label: 'Ultra', hint: '216 DPI' },
];

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'bmp', label: 'BMP' },
];

async function canvasToImageBlob(canvas: HTMLCanvasElement, format: ImageFormat): Promise<Blob | null> {
  if (format === 'bmp') return canvasToBmpBlob(canvas);
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  return new Promise<Blob | null>(res => canvas.toBlob(res, mime, format === 'png' ? undefined : 0.92));
}

export function Edit() {
  const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-word');
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageDpi, setImageDpi] = useState<ImageDpi>(() => loadPreferences().defaultDpi);
  const [imageFormat, setImageFormat] = useState<ImageFormat>(() => loadPreferences().defaultImageFormat);
  const { addActivity } = useAppStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setSuccess(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processPdfToImg = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const scale = imageDpi / 72;
    const ext = imageFormat;

    if (pdf.numPages === 1) {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      
      const blob = await canvasToImageBlob(canvas, imageFormat);
      if (blob) downloadBlob(blob, file.name.replace(/\.pdf$/i, `.${ext}`));
    } else {
      const zip = new JSZip();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        
        const blob = await canvasToImageBlob(canvas, imageFormat);
        if (blob) zip.file(`page_${i}.${ext}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, file.name.replace(/\.pdf$/i, '_images.zip'));
    }
  };

  const processPdfToWord = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const children = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((s: any) => s.str).join(' ');
      children.push(new Paragraph({
        children: [new TextRun(pageText)]
      }));
    }
    
    const doc = new Document({
      sections: [{ properties: {}, children }]
    });
    
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, file.name.replace(/\.pdf$/i, '.docx'));
  };

  const processPdfToExcel = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const wb = XLSX.utils.book_new();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const lines = textContent.items.reduce((acc: any[], item: any) => {
        if (!acc.length || Math.abs(acc[acc.length - 1].y - item.transform[5]) > 5) {
          acc.push({ y: item.transform[5], text: item.str });
        } else {
          acc[acc.length - 1].text += ' ' + item.str;
        }
        return acc;
      }, []);
      
      const wsData = lines.map((l: any) => [l.text]);
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`);
    }
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, file.name.replace(/\.pdf$/i, '.xlsx'));
  };

  const processImagesToPdf = async (images: File[]) => {
    const pdfDoc = await PDFDocument.create();
    for (const image of images) {
      const imgBytes = await image.arrayBuffer();
      let pdfImage;
      if (image.type === 'image/jpeg' || image.type === 'image/jpg') {
        pdfImage = await pdfDoc.embedJpg(imgBytes);
      } else if (image.type === 'image/png') {
        pdfImage = await pdfDoc.embedPng(imgBytes);
      } else {
        continue;
      }
      
      const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height,
      });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    downloadBlob(blob, 'Images_Converted.pdf');
  };

  const processWordToPdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(text, 180);
    
    let y = 10;
    for (let i = 0; i < lines.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(lines[i], 10, y);
      y += 7;
    }
    doc.save(file.name.replace(/\.docx$/i, '.pdf'));
  };

  const processExcelToPdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'buffer' });
    
    const doc = new jsPDF();
    let first = true;
    
    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (data.length > 0) {
        if (!first) doc.addPage();
        first = false;
        doc.text(`Sheet: ${sheetName}`, 14, 15);
        autoTable(doc, {
          startY: 20,
          head: [data[0] || []],
          body: data.slice(1)
        });
      }
    });
    
    doc.save(file.name.replace(/\.xlsx$/i, '.pdf'));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    
    try {
      if (conversionType === 'pdf-to-img') {
        await processPdfToImg(files[0]);
      } else if (conversionType === 'pdf-to-word') {
        await processPdfToWord(files[0]);
      } else if (conversionType === 'pdf-to-excel') {
        await processPdfToExcel(files[0]);
      } else if (conversionType === 'img-to-pdf') {
        await processImagesToPdf(files);
      } else if (conversionType === 'word-to-pdf') {
        await processWordToPdf(files[0]);
      } else if (conversionType === 'excel-to-pdf') {
        await processExcelToPdf(files[0]);
      }
      
      setSuccess(true);
      addActivity({
        id: Date.now().toString(),
        action: `Converted ${conversionType.split('-').join(' ')}`,
        target: files[0]?.name || 'Multiple files',
        date: new Date().toISOString(),
        status: 'success'
      });
      
    } catch (err) {
      console.error(err);
      alert('An error occurred during conversion.');
    }
    
    setProcessing(false);
  };

  const accepts = () => {
    if (conversionType.startsWith('pdf-')) return 'application/pdf';
    if (conversionType === 'img-to-pdf') return 'image/png, image/jpeg';
    if (conversionType === 'word-to-pdf') return '.docx';
    if (conversionType === 'excel-to-pdf') return '.xlsx';
    return '*/*';
  };

  const needsMultiple = conversionType === 'img-to-pdf';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
          <FilePenLine className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Document Edit & Conversion</h1>
          <p className="text-[#071747]/60 text-sm">Convert your documents to and from PDF securely in your browser.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 space-y-2 h-fit">
          <h3 className="text-sm font-bold text-[#071747] mb-3 px-2">From PDF</h3>
          <button 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${conversionType === 'pdf-to-word' ? 'bg-[#075BE8] text-white shadow-sm' : 'text-[#071747]/70 hover:bg-slate-100 hover:text-[#071747]'}`}
            onClick={() => { setConversionType('pdf-to-word'); setFiles([]); setSuccess(false); }}
          >
            <FileText className="w-4 h-4" /> PDF to Word
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${conversionType === 'pdf-to-excel' ? 'bg-[#075BE8] text-white shadow-sm' : 'text-[#071747]/70 hover:bg-slate-100 hover:text-[#071747]'}`}
            onClick={() => { setConversionType('pdf-to-excel'); setFiles([]); setSuccess(false); }}
          >
            <FileSpreadsheet className="w-4 h-4" /> PDF to Excel
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${conversionType === 'pdf-to-img' ? 'bg-[#075BE8] text-white shadow-sm' : 'text-[#071747]/70 hover:bg-slate-100 hover:text-[#071747]'}`}
            onClick={() => { setConversionType('pdf-to-img'); setFiles([]); setSuccess(false); }}
          >
            <ImageIcon className="w-4 h-4" /> PDF to Images
          </button>
          
          <div className="h-px bg-[#DCE7FA] my-4" />
          
          <h3 className="text-sm font-bold text-[#071747] mb-3 px-2">To PDF</h3>
          <button 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${conversionType === 'word-to-pdf' ? 'bg-[#075BE8] text-white shadow-sm' : 'text-[#071747]/70 hover:bg-slate-100 hover:text-[#071747]'}`}
            onClick={() => { setConversionType('word-to-pdf'); setFiles([]); setSuccess(false); }}
          >
            <FileText className="w-4 h-4" /> Word to PDF
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${conversionType === 'excel-to-pdf' ? 'bg-[#075BE8] text-white shadow-sm' : 'text-[#071747]/70 hover:bg-slate-100 hover:text-[#071747]'}`}
            onClick={() => { setConversionType('excel-to-pdf'); setFiles([]); setSuccess(false); }}
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel to PDF
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${conversionType === 'img-to-pdf' ? 'bg-[#075BE8] text-white shadow-sm' : 'text-[#071747]/70 hover:bg-slate-100 hover:text-[#071747]'}`}
            onClick={() => { setConversionType('img-to-pdf'); setFiles([]); setSuccess(false); }}
          >
            <ImageIcon className="w-4 h-4" /> Images to PDF
          </button>
        </Card>

        <Card className="lg:col-span-3 min-h-[400px] flex flex-col items-center justify-center p-8 border-dashed border-2 bg-[#F3F7FF]/30 hover:bg-[#F3F7FF]/60 transition-colors relative group">
          {success ? (
            <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#071747] mb-2">Conversion Complete</h3>
              <p className="text-[#071747]/60 text-sm mb-6">Your converted file has been downloaded successfully.</p>
              <Button onClick={() => { setSuccess(false); setFiles([]); }}>Convert Another File</Button>
            </div>
          ) : files.length > 0 ? (
            <div className="w-full max-w-md bg-white border border-[#DCE7FA] rounded-xl p-4 shadow-sm relative z-10">
              <div className="flex items-center gap-4 border-b border-[#DCE7FA] pb-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#075BE8]">
                  {conversionType.startsWith('pdf-') ? <FileIcon className="w-6 h-6 text-red-500" /> : <FilePenLine className="w-6 h-6 text-[#075BE8]" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-[#071747] truncate">{files.length === 1 ? files[0].name : `${files.length} files selected`}</h4>
                  <p className="text-xs text-[#071747]/60">Ready to convert</p>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#075BE8]">
                  {conversionType.endsWith('-pdf') ? <FileIcon className="w-6 h-6 text-red-500" /> : <FilePenLine className="w-6 h-6 text-[#075BE8]" />}
                </div>
              </div>
              
              {conversionType === 'pdf-to-img' && (
                <div className="mb-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[#071747]/70 mb-1.5">Image quality</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DPI_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setImageDpi(opt.value)}
                          className={`px-2 py-2 rounded-lg border text-center transition-colors ${imageDpi === opt.value ? 'border-[#075BE8] bg-blue-50 text-[#075BE8]' : 'border-[#DCE7FA] text-[#071747]/70 hover:border-[#075BE8]/40'}`}
                        >
                          <span className="block text-sm font-semibold">{opt.label}</span>
                          <span className="block text-[11px] opacity-70">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#071747]/70 mb-1.5">Output format</p>
                    <div className="grid grid-cols-4 gap-2">
                      {FORMAT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setImageFormat(opt.value)}
                          className={`px-2 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${imageFormat === opt.value ? 'border-[#075BE8] bg-blue-50 text-[#075BE8]' : 'border-[#DCE7FA] text-[#071747]/70 hover:border-[#075BE8]/40'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setFiles([])} disabled={processing}>Cancel</Button>
                <Button className="flex-1" onClick={handleConvert} disabled={processing}>
                  {processing ? 'Processing...' : 'Start Conversion'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-[#075BE8] shadow-sm border border-[#DCE7FA] mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#071747] mb-2">
                Select File to Convert
              </h3>
              <p className="text-[#071747]/60 text-sm max-w-sm mx-auto mb-6">
                Drag and drop your file here, or click to browse. Processing is done securely in your browser.
              </p>
              <label className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium bg-[#075BE8] text-white hover:bg-[#064ac2] transition-colors cursor-pointer shadow-sm">
                Browse Files
                <input 
                  type="file" 
                  accept={accepts()}
                  multiple={needsMultiple}
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
          
          {/* Invisible file input covering the whole dropzone when empty */}
          {!success && files.length === 0 && (
            <input 
              type="file" 
              accept={accepts()}
              multiple={needsMultiple}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0" 
              onChange={handleFileChange}
            />
          )}
        </Card>
      </div>
    </div>
  );
}