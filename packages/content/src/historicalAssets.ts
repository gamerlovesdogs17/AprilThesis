export interface HistoricalAssetMetadata {
  id:string;
  localPath:string;
  exactTitle:string;
  author:string;
  publicationDate:string;
  language:string;
  source:string;
  rightsStatus:string;
  modifications:string;
  historicalDate?:string;
  availableFrom?:string;
  availableUntil?:string;
  documentaryOnly?:boolean;
  campaignAvailabilityNote?:string;
}

export const historicalAssets:HistoricalAssetMetadata[]=[{
  id:'workers-opposition-1921-iww-title-page',
  localPath:'/assets/documents/workers-opposition-1921-title-page.jpg',
  exactTitle:'The Workers Opposition in Russia',
  author:'A. Kolontay (Alexandra Kollontai)',
  publicationDate:'1921',language:'English',
  source:'https://commons.wikimedia.org/wiki/File:Alexandra_Kollontai_-_The_Workers_Opposition_in_Russia_(1921).djvu',
  rightsStatus:'Public domain (PD-US-expired; author died more than 70 years ago)',
  modifications:'Commons JPEG page preview; no project pixel edits; CSS display crop only',
  historicalDate:'1921',availableFrom:'1921-01',documentaryOnly:true,
  campaignAvailabilityNote:'Exact publication month unconfirmed; presented only as modern documentary framing, not as a March 1921 room object.',
}];
