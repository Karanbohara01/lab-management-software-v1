import type { Block } from './posts';

/** Renders a post's blocks with comfortable article typography (larger, looser than the app's UI text). */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5 text-[18px] leading-8 text-foreground/85">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} className="pt-4 text-2xl font-semibold tracking-tight text-foreground">
                {block.text}
              </h2>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 marker:text-primary">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-primary">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          default:
            return <p key={i}>{block.text}</p>;
        }
      })}
    </div>
  );
}
