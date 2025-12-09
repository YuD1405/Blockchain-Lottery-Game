export function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = message;

  if (type === "error") toast.style.backgroundColor = "#e74c3c";
  if (type === "info") toast.style.backgroundColor = "#3498db";

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3450);
}