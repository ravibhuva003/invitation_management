/**
 * Sync contact data with Google Sheets in real-time.
 * Uses a Google Apps Script Web App URL to append a row.
 */
export const syncContactToGoogleSheet = async (webhookUrl, contact) => {
  if (!webhookUrl) {
    console.warn("Google Sheets Webhook URL is not configured. Skipping sheets sync.");
    return false;
  }

  // Generate date and time in IST (or user local time format)
  const now = new Date();
  
  // Format Date: DD/MM/YYYY
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  // Format Time: HH:MM:SS AM/PM (12hr format)
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

  // Prepare the row data matching user requirements:
  // Columns: તારીખ, સમય, મોબાઇલ નંબર, વોટ્સએપ નંબર, નામ, ગામ, સરનામું, નોંધ, કેટેગરી
  const payload = {
    date: dateStr,
    time: timeStr,
    mobile: contact.mobile || "",
    whatsapp: contact.whatsapp || "",
    name: contact.name || "",
    village: contact.village || "",
    address: contact.address || "",
    notes: contact.notes || "",
    categories: contact.categories || {}
  };

  try {
    // Send standard POST request to Google Apps Script
    // We send it using mode: 'no-cors' if it is a simple trigger, 
    // but a standard application/json fetch is best. Google App Script web apps 
    // redirects, so fetch with POST works great.
    const response = await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors", // Necessary for Google Script redirects in browser without CORS errors
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Google Sheet sync completed successfully (no-cors mode).");
    return true;
  } catch (err) {
    console.error("Failed to sync contact to Google Sheets:", err);
    throw err;
  }
};

/**
 * Sync invitation data with Google Sheets in real-time.
 */
export const syncInvitationToGoogleSheet = async (webhookUrl, entry) => {
  if (!webhookUrl) {
    console.warn("Google Sheets Webhook URL is not configured. Skipping sheets sync.");
    return false;
  }

  // Generate date and time in IST
  const now = new Date();
  
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

  // Process categories dynamically
  const cats = entry.categories || {};
  
  const payload = {
    date: dateStr,
    time: timeStr,
    name: entry.name || "",
    village: entry.village || "",
    mobile: entry.mobile || "",
    notes: entry.notes || "",
    
    // વ્યવહારવાળી યાદી
    vyavahar_enabled: cats.vyavahar?.enabled ? "હા" : "ના",
    vyavahar_evening_29: cats.vyavahar?.evening_29 || 0,
    vyavahar_morning_30: cats.vyavahar?.morning_30 || 0,
    vyavahar_afternoon_30: cats.vyavahar?.afternoon_30 || 0,
    
    // બે વ્યક્તિ જોડે
    two_person_enabled: cats.two_person?.enabled ? "હા" : "ના",
    two_person_evening_29: cats.two_person?.evening_29 || 0,
    two_person_morning_30: cats.two_person?.morning_30 || 0,
    two_person_afternoon_30: cats.two_person?.afternoon_30 || 0,

    // એક વ્યક્તિ
    one_person_enabled: cats.one_person?.enabled ? "હા" : "ના",
    one_person_evening_29: cats.one_person?.evening_29 || 0,
    one_person_morning_30: cats.one_person?.morning_30 || 0,
    one_person_afternoon_30: cats.one_person?.afternoon_30 || 0,

    // ડિજિટલ આમંત્રણ યાદી
    digital_enabled: cats.digital?.enabled ? "હા" : "ના",
    digital_evening_29: cats.digital?.evening_29 || 0,
    digital_morning_30: cats.digital?.morning_30 || 0,
    digital_afternoon_30: cats.digital?.afternoon_30 || 0
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Invitation Google Sheet sync completed successfully.");
    return true;
  } catch (err) {
    console.error("Failed to sync invitation to Google Sheets:", err);
    throw err;
  }
};
