export interface BlogPost {
  filename: string;
  title: string;
  date: Date;
  content: string;
  tags?: string[];
  sha?: string;
}