export function useRules() {
  function emailValidation(email) {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email) ||
      "Format d'email incorrect"
  }

  function passwordValidation(password) {
    const regex = new RegExp('.{6,}')
    return !!password && regex.test(password) || 'Au moins 6 caractères'
  }

  function passwordSymbols() {
    const symbols = ['!', '@', '#', '$', '%', '^', '&', '*']
    return symbols.join(', ')
  }

  function checkboxRequired(value) {
    return !!value || 'Vous devez cocher cette case pour continuer'
  }

  function required(value) {
    return !!value || 'Ce champ est requis'
  }

  return { emailValidation, passwordValidation, passwordSymbols, checkboxRequired, required }
}
