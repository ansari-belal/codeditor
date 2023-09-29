const form = document.getElementById("registerForm")
const email = document.getElementById("email")
const password = document.getElementById("password")
const err_msg = document.getElementById("error_msg")
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const res = await fetch("/register", {
    method: "POST",
    body: JSON.stringify({email: email.value, password: password.value}),
    headers: {
      "Content-type": "application/json"
    }
  })
  
  const data = await res.json()
  if(data.isReg){
    window.location.href = "/login"
  }else {
    err_msg.style.display = "block"
    err_msg.innerText = data.message
  }
})
