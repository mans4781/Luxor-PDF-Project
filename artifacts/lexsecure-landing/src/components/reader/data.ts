import {
  Zap,
  Feather,
  Shield,
  MousePointerClick,
  Monitor,
  Search,
  ZoomIn,
  ListTree,
  Bookmark,
  Edit3,
  Moon,
  Printer,
  Lock,
  Maximize,
  CheckCircle2,
  XCircle
} from "lucide-react";

export const benefits = [
  { icon: Zap, filled: true, title: "Fast", text: "Open large PDFs in seconds with optimized performance." },
  { icon: Feather, filled: false, title: "Lightweight", text: "Minimal resource usage for a smooth reading experience." },
  { icon: Shield, filled: false, title: "Secure", text: "Your files remain private with no unnecessary cloud uploads." },
  { icon: MousePointerClick, filled: false, title: "Easy to Use", text: "A clean, intuitive interface designed for productivity." },
];

export const features = [
  { icon: Monitor, title: "Smooth Viewing", desc: "Enjoy seamless scrolling and crisp rendering for every type of PDF." },
  { icon: Search, title: "Search PDF", desc: "Find keywords instantly with advanced search and highlighted results." },
  { icon: ZoomIn, title: "Zoom & Fit", desc: "Zoom in, zoom out, or fit documents to the page with one click." },
  { icon: ListTree, title: "Page Navigation", desc: "Move quickly between pages using thumbnails and navigation controls." },
  { icon: Bookmark, title: "Bookmarks", desc: "Add and manage bookmarks to return to important sections." },
  { icon: Edit3, title: "Annotations", desc: "Highlight, underline, strike through, and add notes while reading." },
  { icon: Moon, title: "Dark Mode", desc: "Reduce eye strain with a comfortable dark reading experience." },
  { icon: Printer, title: "Print", desc: "Print documents quickly with clear and flexible print options." },
  { icon: Lock, title: "File Security", desc: "Open password-protected PDF files securely and privately." },
  { icon: Maximize, title: "Full Screen", desc: "Focus entirely on your document with immersive full-screen viewing." },
];

export const systemRequirements = [
  { label: "Operating system", value: "Windows 10 or Windows 11 (64-bit)" },
  { label: "Memory", value: "4 GB RAM minimum · 8 GB recommended for very large documents" },
  { label: "Disk space", value: "300 MB free space for installation" },
  { label: "Display", value: "1280 × 720 resolution or higher" },
  { label: "Internet", value: "Needed for download, automatic updates, and sign-in — reading works fully offline" },
  { label: "Permissions", value: "No administrator rights required — installs for the current user" },
];

export const faqs = [
  {
    q: "Is Luxor PDF Reader free?",
    a: "Yes. The core PDF Reader can be downloaded and used for reading and viewing PDF documents."
  },
  {
    q: "What Windows versions are supported?",
    a: "Luxor PDF Reader is designed for modern 64-bit versions of Windows 10 and Windows 11."
  },
  {
    q: "Is my data safe with Luxor PDF Reader?",
    a: "Luxor PDF Reader is designed to open files locally without requiring routine cloud uploads for document viewing."
  },
  {
    q: "Can I annotate and highlight PDFs?",
    a: "Yes. The reader includes tools for highlighting, underlining, strike-through, and adding notes."
  },
  {
    q: "Does it support password-protected PDFs?",
    a: "Yes. You can open password-protected PDF documents when you have the correct password."
  },
  {
    q: "Will there be Mac or mobile versions?",
    a: "Mac, Android, and iOS versions are planned and should be displayed as coming soon."
  }
];
