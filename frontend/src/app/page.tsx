import ShadowReader from "@/components/ShadowReader";
import { mockContent } from "@/data/mockContent";

export default function Home() {
  return <ShadowReader content={mockContent} />;
}
