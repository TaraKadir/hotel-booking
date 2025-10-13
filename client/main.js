const form = document.getElementById("booking-form");
const msg = document.getElementById("msg");
const loadBtn = document.getElementById("load");
const list = document.getElementById("list");

let startPicker, endPicker;

document.addEventListener("DOMContentLoaded", () => {
  startPicker = flatpickr("#start_date", {
    dateFormat: "Y-m-d",
    locale: "sv",
    onChange: (selectedDates, dateStr) => {
      endPicker.set("minDate", dateStr || null);
      if (
        form.elements.end_date.value &&
        form.elements.end_date.value < dateStr
      ) {
        endPicker.clear();
      }
      form.elements.end_date.focus();
    },
  });

  endPicker = flatpickr("#end_date", {
    dateFormat: "Y-m-d",
    locale: "sv",
  });
});

document.querySelectorAll(".room-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    form.elements.room_type.value = btn.dataset.type;
    window.scrollTo({ top: form.offsetTop - 20, behavior: "smooth" });
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  msg.className = "msg";

  const data = Object.fromEntries(new FormData(form).entries());

  if (data.end_date < data.start_date) {
    msg.textContent = "Slutdatum kan inte vara före startdatum.";
    msg.className = "msg error";
    return;
  }

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Något gick fel");

    msg.textContent = `Bokning skapad! ID: ${json.id}`;
    msg.className = "msg ok";

    form.reset();
    startPicker.clear();
    endPicker.clear();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "msg error";
  }
});

loadBtn.addEventListener("click", async () => {
  list.textContent = "Laddar...";
  loadBtn.disabled = true;

  try {
    const res = await fetch("/api/bookings");
    const data = await res.json();

    const formatDate = (dateString) =>
      new Date(dateString).toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    const formatted = data.map((b) => ({
      ID: b.id,
      Rumstyp: b.room_type,
      Gäst: b.guest_name,
      Epost: b.guest_email,
      Telefon: b.guest_phone || "",
      Incheckning: formatDate(b.start_date),
      Utcheckning: formatDate(b.end_date),
      Skapad: formatDate(b.created_at),
    }));

    list.textContent = JSON.stringify(formatted, null, 2);
  } catch {
    list.textContent = "Kunde inte ladda bokningar.";
  } finally {
    loadBtn.disabled = false;
  }
});
