import type {
  Customer,
  ParsedLineItem,
  ParsedTransaction,
  PaymentMode,
  Product,
  UnitType,
} from '../types';

const NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  one: 1,
  एक: 1,
  do: 2,
  two: 2,
  दो: 2,
  teen: 3,
  three: 3,
  तीन: 3,
  char: 4,
  chaar: 4,
  four: 4,
  चार: 4,
  paanch: 5,
  panch: 5,
  five: 5,
  पांच: 5,
  पाँच: 5,
  chhah: 6,
  cheh: 6,
  six: 6,
  छह: 6,
  saat: 7,
  seven: 7,
  सात: 7,
  aath: 8,
  eight: 8,
  आठ: 8,
  nau: 9,
  nine: 9,
  नौ: 9,
  das: 10,
  ten: 10,
  दस: 10,
  aadha: 0.5,
  adha: 0.5,
  half: 0.5,
  आधा: 0.5,
  आधे: 0.5,
  dedh: 1.5,
  डेढ़: 1.5,
  डेढ: 1.5,
  dhai: 2.5,
  ढाई: 2.5,
  sawa: 1.25,
  सवा: 1.25,
  paune: 0.75,
  पौने: 0.75,
};

const UNIT_WORDS: Record<string, UnitType> = {
  kilo: 'kg',
  kilos: 'kg',
  kg: 'kg',
  kgs: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  किलो: 'kg',
  किग्रा: 'kg',
  litre: 'litre',
  litres: 'litre',
  liter: 'litre',
  liters: 'litre',
  ltr: 'litre',
  ltrs: 'litre',
  l: 'litre',
  लीटर: 'litre',
  लिटर: 'litre',
  packet: 'packet',
  packets: 'packet',
  pkt: 'packet',
  pkts: 'packet',
  pack: 'packet',
  packs: 'packet',
  पैकेट: 'packet',
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  nag: 'piece',
  पीस: 'piece',
};

const PAYMENT_KEYWORDS: Array<{ mode: PaymentMode; words: string[] }> = [
  {
    mode: 'udhaar',
    words: ['udhaar', 'udhar', 'baki', 'baaki', 'credit', 'उधार', 'बाकी'],
  },
  {
    mode: 'upi',
    words: ['upi', 'gpay', 'google pay', 'phonepe', 'phone pe', 'paytm', 'यूपीआई'],
  },
  {
    mode: 'cash',
    words: ['cash', 'nagad', 'naqad', 'नकद', 'कैश'],
  },
];

function normalizeDevanagariDigits(input: string): string {
  const map: Record<string, string> = {
    '०': '0',
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
  };
  return input.replace(/[०-९]/g, (ch) => map[ch] ?? ch);
}

function parseQuantityToken(token: string): number | null {
  const clean = token.trim().toLowerCase();
  if (!clean) return null;
  if (clean in NUMBER_WORDS) {
    return NUMBER_WORDS[clean];
  }
  if (/^\d+(?:\.\d+)?$/.test(clean)) {
    const val = Number.parseFloat(clean);
    return Number.isFinite(val) && val > 0 ? val : null;
  }
  return null;
}

function detectPaymentMode(text: string): PaymentMode {
  const lower = text.toLowerCase();
  for (const group of PAYMENT_KEYWORDS) {
    for (const kw of group.words) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s,.!?])${escaped}($|[\\s,.!?])`, 'i');
      if (regex.test(lower)) {
        return group.mode;
      }
    }
  }
  return 'cash';
}

function matchCustomer(rawName: string | null, customers: Customer[]): Customer | null {
  if (!rawName) return null;
  const target = rawName.trim().toLowerCase();
  if (!target) return null;
  return (
    customers.find((c) => c.name.trim().toLowerCase() === target) ??
    customers.find((c) => c.name.trim().toLowerCase().startsWith(target)) ??
    null
  );
}

function capitalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function tryParsePaymentReceipt(
  normalized: string,
  rawInput: string,
  customers: Customer[]
): ParsedTransaction | null {
  // Examples:
  // "Ramesh se 500 rupaye mile"
  // "Ramesh ne paise diye 500"
  // "Ramesh ne 500 diye"
  // "Ramesh se payment 500"
  const amountFirstPattern =
    /^(.+?)\s+(?:se|से|ne|ने)\s+(?:payment\s+)?(\d+(?:\.\d+)?|[a-zA-Z\u0900-\u097F]+)\s*(?:rupaye|rupees|rupee|rs|₹|रुपये|रुपए|पैसा|paise)?\s*(?:mile|mila|diye|diya|jama|aaye|aaya|payment|मिले|मिला|दिए|दिया)?(?:\s+(?:cash|upi|gpay|phonepe|paytm|nagad))?$/i;

  const paiseFirstPattern =
    /^(.+?)\s+(?:se|से|ne|ने)\s+(?:paise|payment|रुपये|पैसे)\s+(?:mile|mila|diye|diya|मिले|दिए)?\s*(\d+(?:\.\d+)?|[a-zA-Z\u0900-\u097F]+)?(?:\s+(?:cash|upi|gpay|phonepe|paytm|nagad))?$/i;

  const hasReceiptCue =
    /\b(?:mile|mila|diye|diya|payment|jama|aaye|aaya|rupaye|paise)\b|मिले|मिला|दिए|दिया|रुपये|पैसे/i.test(
      normalized
    ) && /\b(?:se|ne)\b|से|ने/i.test(normalized);

  if (!hasReceiptCue) {
    return null;
  }

  let rawCustomer: string | null = null;
  let parsedAmount: number | null = null;

  const m1 = normalized.match(amountFirstPattern);
  if (m1) {
    rawCustomer = m1[1].trim();
    parsedAmount = parseQuantityToken(m1[2]);
  }

  if (parsedAmount === null) {
    const m2 = normalized.match(paiseFirstPattern);
    if (m2) {
      rawCustomer = m2[1].trim();
      parsedAmount = m2[2] ? parseQuantityToken(m2[2]) : null;
    }
  }

  if (!rawCustomer || parsedAmount === null) {
    // Fallback: look for "<Name> se/ne" + any numeric amount
    const custMatch = normalized.match(/^(.+?)\s+(?:se|से|ne|ने)\b/i);
    const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    if (custMatch && numMatch) {
      rawCustomer = custMatch[1].trim();
      parsedAmount = Number.parseFloat(numMatch[1]);
    }
  }

  if (!rawCustomer) return null;

  const matchedCustomer = matchCustomer(rawCustomer, customers);
  const modeDetected = detectPaymentMode(normalized);
  const paymentMode: PaymentMode = modeDetected === 'upi' ? 'upi' : 'cash';

  const warnings: string[] = [];
  if (!matchedCustomer) {
    warnings.push(`Customer "${capitalizeName(rawCustomer)}" Udhaar list mein nahi mila.`);
  }
  if (parsedAmount === null || parsedAmount <= 0) {
    warnings.push('Payment amount samajh nahi aaya, kripya amount darj karein.');
  }

  return {
    kind: 'payment',
    rawInput,
    customerName: matchedCustomer ? matchedCustomer.name : capitalizeName(rawCustomer),
    matchedCustomerId: matchedCustomer ? matchedCustomer.id : null,
    paymentMode,
    paymentAmount: parsedAmount,
    items: [],
    warnings,
  };
}

function matchProduct(phrase: string, products: Product[]): Product | null {
  const clean = phrase.trim().toLowerCase();
  if (!clean) return null;

  // Build candidate terms longest-first so "chai patti" beats "chai"
  const candidates: Array<{ term: string; product: Product }> = [];
  for (const product of products) {
    candidates.push({ term: product.name.toLowerCase(), product });
    if (product.hindiName) {
      candidates.push({ term: product.hindiName.toLowerCase(), product });
    }
    for (const alias of product.aliases) {
      candidates.push({ term: alias.toLowerCase(), product });
    }
  }
  candidates.sort((a, b) => b.term.length - a.term.length);

  // Exact match or singularized match (e.g. "maggis" / "packets")
  for (const { term, product } of candidates) {
    if (clean === term || clean === `${term}s`) {
      return product;
    }
  }

  return null;
}

function splitSegments(text: string): string[] {
  // First split on explicit connectors: comma, aur, and, +, &, और
  const primaryParts = text
    .split(/(?:,|\+|\s+aur\s+|\s+and\s+|\s+&\s+|\s+और\s+|\s+तथा\s+)/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  // Second pass: if a segment contains multiple items without "aur" (e.g. "2 kilo chawal 1 tel")
  const qtyStartTokens = new Set([...Object.keys(NUMBER_WORDS)]);
  const segments: string[] = [];

  for (const part of primaryParts) {
    const tokens = part.split(/\s+/).filter(Boolean);
    let current: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const lower = tok.toLowerCase();
      const isQty = /^\d+(?:\.\d+)?$/.test(lower) || qtyStartTokens.has(lower);
      // Start a new item chunk if we already have non-qty product words in `current`
      if (
        isQty &&
        current.length > 0 &&
        current.some((w) => {
          const wl = w.toLowerCase();
          return !(/^\d+(?:\.\d+)?$/.test(wl) || qtyStartTokens.has(wl) || wl in UNIT_WORDS);
        })
      ) {
        segments.push(current.join(' '));
        current = [tok];
      } else {
        current.push(tok);
      }
    }

    if (current.length > 0) {
      segments.push(current.join(' '));
    }
  }

  return segments;
}

export function parseTransaction(
  rawInput: string,
  products: Product[],
  customers: Customer[]
): ParsedTransaction {
  const trimmed = rawInput.trim();
  const normalized = normalizeDevanagariDigits(trimmed).replace(/[।|]+/g, ' ').trim();

  if (!normalized) {
    return {
      kind: 'sale',
      rawInput,
      customerName: null,
      matchedCustomerId: null,
      paymentMode: 'cash',
      paymentAmount: null,
      items: [],
      warnings: ['Kripya koi transaction bolen ya type karein.'],
    };
  }

  // 1. Check if this is a payment receipt (e.g. "Ramesh se 500 rupaye mile")
  const paymentReceipt = tryParsePaymentReceipt(normalized, rawInput, customers);
  if (paymentReceipt) {
    return paymentReceipt;
  }

  // 2. Sale transaction parsing
  const paymentMode = detectPaymentMode(normalized);
  let working = normalized;
  let extractedCustomerName: string | null = null;

  // Match customer before "ko udhaar", "ko baki", "ke naam", etc.
  // 1) First try matching any existing customer directly before "ko/ke/ka udhaar|baki"
  const sortedCustomers = [...customers].sort((a, b) => b.name.length - a.name.length);
  for (const cust of sortedCustomers) {
    const escaped = cust.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const knownBeforeUdhaar = new RegExp(
      `(?:^|[,\\s])(${escaped})\\s+(?:ko|ke|ka|को|के|का)\\s+(?:udhaar|udhar|baki|baaki|khata|naam|उधार|बाकी)\\b`,
      'i'
    );
    const m = working.match(knownBeforeUdhaar);
    if (m) {
      extractedCustomerName = cust.name;
      working = working.replace(m[0], ' ');
      break;
    }
  }

  // 2) Otherwise match comma-separated up-to-2-word name OR single word right before "ko udhaar"
  const customerAfterCommaBeforeUdhaar = !extractedCustomerName
    ? working.match(
        /,\s*([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:ko|ke|ka|को|के|का)\s+(?:udhaar|udhar|baki|baaki|khata|naam|उधार|बाकी)\b/i
      )
    : null;

  const customerSingleWordBeforeUdhaar =
    !extractedCustomerName && !customerAfterCommaBeforeUdhaar
      ? working.match(
          /(?:^|\s)([A-Za-z\u0900-\u097F]+)\s+(?:ko|ke|ka|को|के|का)\s+(?:udhaar|udhar|baki|baaki|khata|naam|उधार|बाकी)\b/i
        )
      : null;

  const customerBeforeUdhaar = customerAfterCommaBeforeUdhaar ?? customerSingleWordBeforeUdhaar;

  if (!extractedCustomerName && customerBeforeUdhaar) {
    extractedCustomerName = customerBeforeUdhaar[1].trim();
    working = working.replace(customerBeforeUdhaar[0], ' ');
  } else if (!extractedCustomerName) {
    // Also check "<Customer> ko" when udhaar is mentioned or at the end
    const customerBeforeKo = working.match(
      /(?:^|[,\s])([A-Za-z\u0900-\u097F]+)\s+(?:ko|को)\s*(?:,|$)/i
    );
    if (customerBeforeKo) {
      extractedCustomerName = customerBeforeKo[1].trim();
      working = working.replace(customerBeforeKo[0], ' ');
    } else {
      // Check if an existing customer's name appears cleanly as a standalone word
      for (const cust of sortedCustomers) {
        const escaped = cust.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[,\\s])${escaped}($|[,\\s])`, 'i');
        if (re.test(working)) {
          extractedCustomerName = cust.name;
          working = working.replace(re, ' ');
          break;
        }
      }
    }
  }

  // Strip standalone payment keywords from item text
  for (const group of PAYMENT_KEYWORDS) {
    for (const kw of group.words) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[\\s,])${escaped}($|[\\s,])`, 'gi');
      working = working.replace(re, ' ');
    }
  }

  // Clean dangling punctuation/filler words
  working = working
    .replace(/\b(?:ka|ki|ke|ko|se|mein|me|for|का|की|के|को|से)\b/gi, ' ')
    .replace(/[,]+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

  const segments = splitSegments(working);
  const items: ParsedLineItem[] = [];
  const warnings: string[] = [];

  segments.forEach((segment, idx) => {
    const cleanSeg = segment.replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
    if (!cleanSeg) return;

    const tokens = cleanSeg.split(/\s+/).filter(Boolean);
    let qty = 1;
    let unit: UnitType | null = null;
    const nameTokens: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const lower = tok.toLowerCase();

      // Only consume first quantity token as item quantity
      if (nameTokens.length === 0 && unit === null) {
        const parsedQty = parseQuantityToken(lower);
        if (parsedQty !== null) {
          qty = parsedQty;
          continue;
        }
      }

      if (lower in UNIT_WORDS && unit === null) {
        unit = UNIT_WORDS[lower];
        continue;
      }

      nameTokens.push(tok);
    }

    const rawProductName = nameTokens.join(' ').trim();
    if (!rawProductName) {
      return;
    }

    const matched = matchProduct(rawProductName, products);
    if (matched) {
      items.push({
        tempId: `item-${idx}-${Date.now()}`,
        rawText: cleanSeg,
        rawProductName,
        productId: matched.id,
        productName: matched.name,
        hindiName: matched.hindiName,
        quantity: qty,
        unit: unit ?? matched.unit,
        unitPrice: matched.price,
        gstRate: matched.gstRate,
        isUnknown: false,
      });
    } else {
      warnings.push(`Unknown product: "${rawProductName}". Kripya list se sahi item chunein.`);
      items.push({
        tempId: `item-${idx}-${Date.now()}`,
        rawText: cleanSeg,
        rawProductName,
        productId: null,
        productName: capitalizeName(rawProductName),
        hindiName: '',
        quantity: qty,
        unit: unit ?? 'piece',
        unitPrice: 0,
        gstRate: 0,
        isUnknown: true,
      });
    }
  });

  if (items.length === 0) {
    warnings.push('Koi item pehchana nahi gaya. Example: "2 kilo chawal aur 1 tel, Ramesh ko udhaar"');
  }

  const matchedCustomer = matchCustomer(extractedCustomerName, customers);
  if (extractedCustomerName && !matchedCustomer) {
    warnings.push(
      `Customer "${capitalizeName(extractedCustomerName)}" list mein nahi hai — confirmation mein add ya select karein.`
    );
  }

  return {
    kind: 'sale',
    rawInput,
    customerName: matchedCustomer
      ? matchedCustomer.name
      : extractedCustomerName
        ? capitalizeName(extractedCustomerName)
        : null,
    matchedCustomerId: matchedCustomer ? matchedCustomer.id : null,
    paymentMode,
    paymentAmount: null,
    items,
    warnings,
  };
}
