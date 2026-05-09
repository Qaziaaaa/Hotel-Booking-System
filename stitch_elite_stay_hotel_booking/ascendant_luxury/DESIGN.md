---
name: Ascendant Luxury
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style
The brand personality is centered on exclusivity and effortless sophistication. It aims to evoke the feeling of a private concierge service—quietly confident, meticulously organized, and deeply trustworthy. 

The visual style is **Modern Minimalist with Tonal Depth**, prioritizing high-resolution photography and expansive negative space to allow the properties to remain the focus. The interface utilizes full-width hero sections and immersive imagery to create an aspirational atmosphere. Interactions are characterized by smooth, intentional transitions that mimic the fluidity of high-end hospitality.

## Colors
The palette is rooted in a **Deep Navy (#0F172A)**, used for primary typography and high-contrast backgrounds to establish authority and depth. **Gold (#D4AF37)** is applied sparingly as a signature accent for highlights, calls to action, and premium signifiers. 

White and an off-white "Chalk" (#F8FAFC) provide the foundation for the layout, ensuring a clean and airy aesthetic. For text hierarchy, a muted Slate Neutral is used to de-emphasize secondary information without sacrificing legibility.

## Typography
The typography system uses a high-contrast serif, **Playfair Display**, for all editorial moments and headings to convey a sense of heritage and luxury. Large display sizes should use tighter letter-spacing to maintain a modern edge.

For functional interface elements and long-form body copy, **DM Sans** provides a clean, low-contrast geometric structure that ensures maximum readability across devices. Use the `label-caps` style for small descriptors, such as room categories or status indicators, to add an architectural feel to the information design.

## Layout & Spacing
This design system utilizes a **12-column fixed grid** for desktop, centered within the viewport, while hero sections and image galleries are permitted to break the grid for full-bleed immersion. 

The vertical rhythm is generous; use the `section-gap` variable (120px) between major content blocks to prevent the UI from feeling cluttered. On mobile, the grid collapses to 4 columns with increased vertical padding to allow for comfortable thumb-driven navigation.

## Elevation & Depth
Depth is articulated through **Ambient Shadows** and subtle tonal shifts rather than harsh borders. Cards and modals should utilize a multi-layered shadow with a wide blur radius and very low opacity (3-5%) tinted with the Navy primary color to feel integrated into the surface.

Interactive elements use "Lift" on hover—a subtle vertical translation paired with an increased shadow spread. Backgrounds for secondary sections should use a faint Gold-tinted cream or a 2% Navy wash to distinguish them from the primary white canvas.

## Shapes
The shape language is defined by **large, sophisticated radii**. While standard buttons and inputs follow a 0.5rem (8px) radius, high-impact components like property cards and search containers utilize "rounded-xl" (1.5rem / 24px) to soften the interface and make it feel more approachable and modern. 

Avoid completely circular "pill" shapes for primary buttons to maintain a more formal, structured appearance. Use 1px inset borders in Gold for decorative elements or premium card states.

## Components
- **Buttons:** Primary buttons use a solid Deep Navy background with Gold text or White text. Secondary buttons are ghost-style with a thin 1px Gold border. All buttons feature a 300ms ease-out transition on hover.
- **Inputs:** Search and form fields use a minimal bottom-border only or a very soft light-gray fill with no heavy outlines. Focus states are indicated by a subtle Gold glow or underline.
- **Cards:** Property cards are the centerpiece. They feature full-bleed imagery, the `rounded-xl` radius, and a gentle shadow. Typography within cards should be strictly hierarchical: Playfair for the property name and DM Sans for the price/location.
- **Navigation:** The header is transparent on scroll-top, transitioning to a frosted white (glassmorphism) or solid Deep Navy upon scrolling.
- **Booking Bar:** A persistent, floating bar for date selection should utilize high roundedness and a soft shadow to appear as if it is hovering above the content.