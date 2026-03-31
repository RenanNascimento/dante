"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import UploadModal from "@/components/UploadModal";

const Reader = dynamic(() => import("@/components/Reader"), { ssr: false });

export default function Home() {
  const [bookData, setBookData] = useState<ArrayBuffer | null>(null);

  if (bookData) {
    return <Reader data={bookData} onClose={() => setBookData(null)} />;
  }

  return <UploadModal onFileLoad={setBookData} />;
}
