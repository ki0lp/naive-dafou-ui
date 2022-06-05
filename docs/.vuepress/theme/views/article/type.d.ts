export interface TocData {
  children: TocData[];
  level: string | null;
  slug: number;
  title: string;
  isCurrent: boolean;
  offsetTop?: number;
}
