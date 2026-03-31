export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/superadmin', '/api/', '/staff', '/manager', '/referidor', '/agencia'],
      },
    ],
    sitemap: 'https://itrustb2b.com/sitemap.xml',
  }
}
