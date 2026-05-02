import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i;

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "video", "source"],
  attributes: {
    ...defaultSchema.attributes,
    video: ["controls", "src", "style", "preload"],
    source: ["src", "type"],
    img: [...(defaultSchema.attributes?.img || []), "src", "alt", "style"],
  },
};

const components: Components = {
  img: ({ src, alt, ...props }) => {
    const srcStr = typeof src === "string" ? src : "";
    if (srcStr && VIDEO_EXTENSIONS.test(srcStr)) {
      return (
        <video
          controls
          preload="metadata"
          style={{ maxWidth: "100%", borderRadius: 8, margin: "0.5rem 0" }}
        >
          <source src={srcStr} />
        </video>
      );
    }
    return (
      <img
        src={srcStr}
        alt={typeof alt === "string" ? alt : ""}
        style={{ maxWidth: "100%", borderRadius: 8, margin: "0.5rem 0" }}
        loading="lazy"
      />
    );
  },
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }} {...props}>
      {children}
    </a>
  ),
};

export default function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
