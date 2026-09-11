export function isHomeNavigationItem(label: string, href: string) {
  return label.trim().toLowerCase() === 'home' || href === '/' || href === '/#home' || href === '#home';
}

export function isCleanHomepageLocation(pathname: string, search: string, hash: string) {
  return pathname === '/' && search === '' && hash === '';
}
