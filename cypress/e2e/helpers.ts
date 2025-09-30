export const replaceHost = (cy: Cypress.cy & CyEventEmitter, subdomain: string) => {
  cy.on('window:before:load', (win) => {
    // @ts-expect-error We need to set the location property here to use the subdomain system
    win.__location = {
      host: cy.stub().as('host').returns(`${subdomain}.${win.location.host}`),
    }
  })
}
export const intercept = (path: string, cy: Cypress.cy & CyEventEmitter, name: string) => {
  cy.intercept('GET', path, (req) => {
    delete req.headers['if-modified-since']
    delete req.headers['if-none-match']
    delete req.headers['proxy-connection']
    req.on('response', (res) => {
      res.body = res.body.replaceAll('window.location.host', 'window.__location.host')
    })
  }).as(name)
}
export const handleLocation = (
  path: string,
  cy: Cypress.cy & CyEventEmitter,
  name: string,
  subdomain: string,
) => {
  replaceHost(cy, subdomain)
  intercept(path, cy, name)
}
