// adding the convert script to head
if (typeof _conv_host == 'undefined') {
  window['_conv_prevent_bodyhide'] = true
  window['_conv_page_type'] = 'order_confirmation'

  const isInjected = Array.prototype.slice
    .apply(document.getElementsByTagName('script'))
    .some((el) =>
      el.src.includes(
        'cdn-4.convertexperiments.com/v1/js/10042572-10044033.js'
      )
    )
  if (!isInjected) {
    let _conv_track = document.createElement('script')
    _conv_track.src =
      '//cdn-4.convertexperiments.com/v1/js/###shop_project_id###.js'
    document.getElementsByTagName('head')[0].appendChild(_conv_track)
  }
}

const currency_to_report = 'USD'

// doing logic to submit track conversions
if (Shopify?.Checkout?.step === 'thank_you') {
  console.log('%cConvert: We are on the thank you page', 'color: lightgreen')

  let convert_attributes = JSON.parse(
    localStorage.getItem('convert_attributes')
  )

  fetch('https://cdn.shopify.com/s/javascripts/currencies.js')
    .then((res) => res.text())
    .then((jsCode) => {
      try {
        const jsContext = {} // provide custom context for JS code (i.e. "this" inside JS refers to jsContext instead of window)
        const Currency = Function(
          `"use strict"; ${jsCode} return Currency;`
        ).call(jsContext)

        console.log('%cConvert: Multicurrency method', 'color: lightgreen')
        if (convert_attributes) {
          console.log('%cConvert: We have attributes', 'color: lightgreen')
          console.log(
            '%cConvert: Attributes',
            'color: lightgreen',
            convert_attributes
          )

          //build POST data to be sent
          const post = {
            cid: convert_attributes.cid,
            pid: convert_attributes.pid,
            seg: convert_attributes.visitorSegments,
            s: 'shopify',
            vid: convert_attributes.vid,
            ev: [
              {
                evt: 'tr',
                goals: [convert_attributes.goals],
                exps: convert_attributes.exps,
                vars: convert_attributes.vars,
                tid: Shopify?.checkout?.token,
                r: parseFloat(
                  Currency.convert(
                    Shopify?.checkout?.subtotal_price,
                    Shopify?.Checkout?.currency,
                    currency_to_report
                  )
                ),
                prc: Shopify?.checkout?.line_items?.reduce((acc, item) => {
                  return acc + item.quantity
                }, 0)
              },
              {
                evt: 'hitGoal',
                goals: [convert_attributes.goals],
                exps: convert_attributes.exps,
                vars: convert_attributes.vars
              }
            ]
          }

          const data = JSON.stringify(post)
          console.log('%cConvert: Conversion data', 'color: lightgreen', data)

          fetch(
            `https://${convert_attributes.pid}.metrics.convertexperiments.com/track`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
              },
              body: data
            }
          )
            .then((response) => response.json())
            .then((_) => {
              console.log(
                '%cConvert: Conversion registered',
                'color: lightgreen'
              )
            })
            .catch(function (error) {
              console.error(
                '%cConvert: Error registering conversion',
                'color: deeppink',
                error
              )
            })
        }
      } catch (error) {
        console.error(
          '%cConvert: Error in multicurrency conversion',
          'color: deeppink',
          error
        )
      }
    })
}
