export interface Pictogram {
    word: string;
    url: string;
}

export interface Phrase {
    id: string;
    text: string;
    usage_count: number;
    pictograms: Pictogram[];
}
