# PT Sans Font Base64 for jsPDF

## Quick Access

The PT Sans Regular font with Cyrillic support is available as base64 from:

**Backend Function URL:**
```
https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d
```

## How to Get the Base64 String

### Option 1: Using Bun (Recommended)
```bash
bun run fetch-font.ts
```

### Option 2: Using Python
```bash
python3 get_pt_sans_base64.py
```

### Option 3: Using curl
```bash
curl https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d
```

### Option 4: Using wget
```bash
wget -qO- https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d
```

### Option 5: In Browser
Open the file `get-font-base64.html` in your browser. It will:
- Fetch the base64 automatically
- Display it in a text area
- Copy it to your clipboard
- Log it to the console

### Option 6: Direct Fetch in JavaScript/TypeScript
```typescript
const response = await fetch('https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d');
const base64 = await response.text();
console.log(base64);
```

## Font Details

- **Font Name:** PT Sans Regular
- **Source:** Google Fonts (https://fonts.google.com/specimen/PT+Sans)
- **File:** PT_Sans-Web-Regular.ttf
- **Cyrillic Support:** Yes ✓
- **License:** Open Font License (OFL)
- **Format:** TTF (TrueType Font)
- **Encoding:** Base64

## Usage with jsPDF

```javascript
import jsPDF from 'jspdf';

// Fetch the base64 font
const response = await fetch('https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d');
const ptSansBase64 = await response.text();

// Add font to jsPDF
const doc = new jsPDF();
doc.addFileToVFS('PTSans-Regular.ttf', ptSansBase64);
doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
doc.setFont('PTSans');

// Now you can use Cyrillic text
doc.text('Привет мир!', 10, 10);
doc.save('cyrillic-document.pdf');
```

## Files Created

- `fetch-font.ts` - TypeScript script to fetch and output base64
- `get_pt_sans_base64.py` - Python script to fetch and output base64
- `download_and_save_font.py` - Python script that saves base64 to file
- `get-font-base64.html` - HTML page with automatic fetch and clipboard copy
- `backend/get-font/index.py` - Backend function that downloads and converts font
