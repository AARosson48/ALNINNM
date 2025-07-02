// Main JavaScript for Anonymous Personals

document.addEventListener("DOMContentLoaded", () => {
  // Vote button functionality
  const voteButtons = document.querySelectorAll(".vote-btn")

  voteButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const adId = this.dataset.adId
      const voteType = this.dataset.voteType

      // Disable button during request
      this.disabled = true
      const originalText = this.innerHTML
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

      try {
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ad_id: Number.parseInt(adId),
            vote_type: voteType,
          }),
        })

        const result = await response.json()

        if (result.success) {
          // Show success message
          showToast("Vote recorded successfully!", "success")

          // Refresh the page to show updated vote counts
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          showToast("Error: " + result.error, "error")
        }
      } catch (error) {
        showToast("Failed to record vote. Please try again.", "error")
      } finally {
        this.disabled = false
        this.innerHTML = originalText
      }
    })
  })

  // Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll(".alert-dismissible")
  alerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = new window.bootstrap.Alert(alert)
      bsAlert.close()
    }, 5000)
  })
})

// Toast notification function
function showToast(message, type = "info") {
  // Create toast element
  const toast = document.createElement("div")
  toast.className = `alert alert-${type === "error" ? "danger" : type} alert-dismissible fade show position-fixed`
  toast.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;"
  toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

  document.body.appendChild(toast)

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 3000)
}

// Form validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validateForm(form) {
  const requiredFields = form.querySelectorAll("[required]")
  let isValid = true

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      field.classList.add("is-invalid")
      isValid = false
    } else {
      field.classList.remove("is-invalid")
    }
  })

  return isValid
}
