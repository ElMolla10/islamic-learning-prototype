import {describe,expect,it} from "vitest";
import {compactNumberRanges,groupSourceLocations} from "./source-display";

describe("learner-facing source references",()=>{
  it("sorts, deduplicates, and groups consecutive printed pages",()=>{
    const groups=groupSourceLocations([{volume:1,page:8,printedPage:8},{volume:1,page:9,printedPage:9},{volume:1,page:25,printedPage:25},{volume:1,page:26,printedPage:26},{volume:1,page:25,printedPage:25},{volume:1,page:28,printedPage:28}]);
    expect(groups).toHaveLength(1);expect(compactNumberRanges(groups[0].printedPages)).toBe("8–9, 25–26, 28");expect(groups[0].hasDifferentPdfMapping).toBe(false);
  });
  it("keeps materially different PDF mappings available separately",()=>{
    const [group]=groupSourceLocations([{volume:1,page:100,printedPage:42},{volume:1,page:101,printedPage:43}]);expect(group.hasDifferentPdfMapping).toBe(true);expect(group.mappings).toEqual([{printed:42,pdf:100},{printed:43,pdf:101}]);
  });
});
