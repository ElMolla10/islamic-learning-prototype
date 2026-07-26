import type { SourceLocation } from "@/content/types";

export type GroupedLocation={volume?:number;printedPages:number[];pdfPages:number[];mappings:{printed?:number;pdf:number}[];hasDifferentPdfMapping:boolean};

export function compactNumberRanges(values:number[],separator=", "){
  const sorted=[...new Set(values)].sort((a,b)=>a-b);const result:string[]=[];
  for(let index=0;index<sorted.length;index+=1){const start=sorted[index];let end=start;while(index+1<sorted.length&&sorted[index+1]===end+1){end=sorted[++index];}result.push(start===end?String(start):`${start}–${end}`);}
  return result.join(separator);
}

export function groupSourceLocations(locations:SourceLocation[]):GroupedLocation[]{
  const unique=new Map<string,SourceLocation>();
  locations.forEach(location=>unique.set(`${location.volume??"none"}:${location.page}:${location.printedPage??"none"}`,location));
  const groups=new Map<string,SourceLocation[]>();
  [...unique.values()].forEach(location=>{const key=String(location.volume??"none");groups.set(key,[...(groups.get(key)??[]),location]);});
  return [...groups.values()].map(rows=>{
    const ordered=[...rows].sort((a,b)=>(a.printedPage??a.page)-(b.printedPage??b.page));
    return {volume:ordered[0].volume,printedPages:ordered.map(row=>row.printedPage).filter((page):page is number=>page!==undefined),pdfPages:ordered.map(row=>row.page),mappings:ordered.map(row=>({printed:row.printedPage,pdf:row.page})),hasDifferentPdfMapping:ordered.some(row=>row.printedPage!==undefined&&row.printedPage!==row.page)};
  }).sort((a,b)=>(a.volume??0)-(b.volume??0));
}
