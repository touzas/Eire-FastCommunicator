export interface Pictogram {
    word: string;
    url: string;
    base64?: string;
}

export interface Phrase {
    id: string;
    text: string;
    usage_count: number;
    pictograms: Pictogram[];
    type?: 'word' | 'phrase'; // Default: 'phrase' for backward compatibility
}
