interface Window {
  wpwlOptions?: {
    onReady?: () => void;
    style?: string;
    locale?: string;
    labels?: {
      cvv?: string;
      cardHolder?: string;
    };
  };
}
