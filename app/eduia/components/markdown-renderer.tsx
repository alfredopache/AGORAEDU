"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headers
          h1: ({ node, ...props }) => (
            <h1 
              className="text-2xl font-bold mb-3 mt-4 text-slate-900 dark:text-white border-b-2 border-purple-500 pb-2" 
              {...props} 
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 
              className="text-xl font-bold mb-2 mt-3 text-slate-800 dark:text-slate-100" 
              {...props} 
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 
              className="text-lg font-semibold mb-2 mt-2 text-slate-700 dark:text-slate-200" 
              {...props} 
            />
          ),
          h4: ({ node, ...props }) => (
            <h4 
              className="text-base font-semibold mb-1 mt-2 text-slate-700 dark:text-slate-300" 
              {...props} 
            />
          ),
          
          // Text formatting
          strong: ({ node, ...props }) => (
            <strong 
              className="font-bold text-purple-700 dark:text-purple-300" 
              {...props} 
            />
          ),
          em: ({ node, ...props }) => (
            <em 
              className="italic text-pink-700 dark:text-pink-300 not-italic font-medium" 
              {...props} 
            />
          ),
          
          // Lists
          ul: ({ node, ...props }) => (
            <ul 
              className="list-disc list-outside space-y-1 my-3 ml-5 text-slate-700 dark:text-slate-300" 
              {...props} 
            />
          ),
          ol: ({ node, ...props }) => (
            <ol 
              className="list-decimal list-outside space-y-1 my-3 ml-5 text-slate-700 dark:text-slate-300" 
              {...props} 
            />
          ),
          li: ({ node, ...props }) => (
            <li 
              className="text-sm leading-relaxed mb-1" 
              {...props} 
            />
          ),
          
          // Code
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className
            return isInline ? (
              <code
                className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded text-sm font-mono border border-purple-200 dark:border-purple-700"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className="bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto my-3 border border-slate-700">
                <code
                  className="text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              </pre>
            )
          },
          
          // Blockquote (citas)
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 pl-4 pr-3 py-3 my-3 italic text-sm text-slate-700 dark:text-slate-300 rounded-r-lg"
              {...props}
            />
          ),
          
          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          
          // Paragraphs
          p: ({ node, ...props }) => (
            <p 
              className="mb-2 leading-relaxed text-slate-700 dark:text-slate-300" 
              {...props} 
            />
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr 
              className="my-4 border-t-2 border-slate-300 dark:border-slate-700" 
              {...props} 
            />
          ),
          
          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-slate-300 dark:border-slate-700">
              <table 
                className="min-w-full border-collapse" 
                {...props} 
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th 
              className="border border-slate-300 dark:border-slate-700 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 text-left font-bold text-sm text-purple-900 dark:text-purple-100" 
              {...props} 
            />
          ),
          td: ({ node, ...props }) => (
            <td 
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300" 
              {...props} 
            />
          ),
          
          // Task lists (GitHub style)
          input: ({ node, ...props }: any) => {
            if (props.type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  className="mr-2 accent-purple-600"
                  {...props}
                />
              )
            }
            return <input {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
