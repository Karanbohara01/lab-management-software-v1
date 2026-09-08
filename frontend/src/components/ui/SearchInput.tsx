import { Search } from 'lucide-react';
import { Input, type InputProps } from './Input';

/** Text input pre-wired with a search icon. Debounce at the call site with useDebouncedValue. */
export function SearchInput(props: Omit<InputProps, 'leadingIcon' | 'type'>) {
  return (
    <Input
      type="search"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      placeholder="Search…"
      {...props}
    />
  );
}
