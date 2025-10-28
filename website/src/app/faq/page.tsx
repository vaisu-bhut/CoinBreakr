export default function FAQ() {
  const faqs = [
    {
      question: "How does CoinBreakr work?",
      answer: "CoinBreakr makes splitting expenses simple. Add your friends, create groups for different activities, input shared expenses, and we'll automatically calculate who owes what. You can then track balances and mark payments as complete when settled."
    },
    {
      question: "Is CoinBreakr free to use?",
      answer: "Yes! CoinBreakr is completely free to download and use. There are no hidden fees, subscriptions, or premium features. We believe expense splitting should be accessible to everyone."
    },
    {
      question: "How do I add friends to CoinBreakr?",
      answer: "You can add friends by their email address or phone number. Once you send an invitation, they'll receive a notification to join CoinBreakr. You can also add friends from your contacts list."
    },
    {
      question: "Can I split expenses unequally?",
      answer: "Absolutely! While equal splits are the default, you can customize how expenses are divided. Split by exact amounts, percentages, or exclude certain people from specific expenses."
    },
    {
      question: "What types of expenses can I track?",
      answer: "You can track any shared expense - restaurant bills, groceries, rent, utilities, travel costs, entertainment, and more. Add descriptions, photos of receipts, and categorize expenses for better organization."
    },
    {
      question: "How do I settle up with friends?",
      answer: "CoinBreakr shows you exactly who owes what to whom. When someone pays you back, simply mark the payment as complete in the app. The balances will automatically update for everyone involved."
    },
    {
      question: "Can I use CoinBreakr for group trips?",
      answer: "Yes! Create a group for your trip and add all participants. Track shared expenses like accommodation, meals, transportation, and activities. Everyone can see the running total and their individual balance."
    },
    {
      question: "Is my financial data secure?",
      answer: "Your privacy and security are our top priorities. All data is encrypted in transit and at rest. We never store banking information or payment details - only the expense amounts and descriptions you choose to share."
    },
    {
      question: "Can I export my expense data?",
      answer: "Yes, you can export your expense history and transaction data at any time. This is useful for personal budgeting, tax purposes, or if you want to switch to another service."
    },
    {
      question: "What if someone doesn't have the app?",
      answer: "You can still add expenses involving people who don't have CoinBreakr. They'll receive notifications about shared expenses via email or SMS, and can view their balance through a web link without needing to download the app."
    },
    {
      question: "How do I delete my account?",
      answer: "You can delete your account anytime from the app settings. This will permanently remove all your data from our servers. Make sure to settle any outstanding balances before deleting your account."
    },
    {
      question: "Does CoinBreakr work offline?",
      answer: "You can view your existing expenses and balances offline, but adding new expenses or syncing with friends requires an internet connection. Any changes made offline will sync when you're back online."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about CoinBreakr
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer p-6 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <svg 
                    className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Contact Support
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}