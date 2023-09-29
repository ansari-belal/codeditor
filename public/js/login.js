const form = document.getElementById("loginForm")
const email = document.getElementById("email")
const password = document.getElementById("password")
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const res = await fetch("/login", {
    method: "POST",
    body: JSON.stringify({email: email.value, password: password.value}),
    headers: {
      "Content-type": "application/json"
    }
  })
  
  const data = await res.json()

  if(data.isLoggedIn){
    localStorage.setItem("username", data.username)
    window.location.href = "/editor"
  }else {
    alert(data.message)
  }
  
})
