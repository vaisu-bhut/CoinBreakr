export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Split <span className="text-blue-600">Expenses</span> Effortlessly
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              CoinBreakr makes splitting expenses with friends and family simple and fair. 
              Track shared costs, settle debts, and never worry about who owes what again 
              with our intuitive mobile app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#download"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download Now
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors font-medium"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </a>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                  <span className="text-blue-600 font-medium">3 pending</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🍕</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pizza Night</p>
                        <p className="text-sm text-gray-500">with Sarah, Mike</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">$45.60</p>
                      <p className="text-sm text-green-600">You're owed $15.20</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">⛽</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Gas for Trip</p>
                        <p className="text-sm text-gray-500">Weekend getaway</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">$80.00</p>
                      <p className="text-sm text-red-600">You owe $26.67</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Your Balance</span>
                    <span className="text-green-600 font-bold text-lg">+$12.47</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Overall, you're owed money</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}