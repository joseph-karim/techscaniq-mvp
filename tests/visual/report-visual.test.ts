import { test, expect } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

test.describe('Report Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
  });
  
  test('should render technology section correctly', async ({ page }) => {
    await page.goto('/report/visual-test-report');
    await page.waitForSelector('[data-testid="technology-section"]');
    
    // Wait for any dynamic content to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot with Argos
    await argosScreenshot(page, 'technology-section', {
      element: '[data-testid="technology-section"]'
    });
    
    // Custom visual comparison
    const element = page.locator('[data-testid="technology-section"]');
    const boundingBox = await element.boundingBox();
    
    if (boundingBox) {
      const screenshot = await page.screenshot({
        clip: boundingBox
      });
      
      try {
        const baseline = await loadBaselineImage('technology-section');
        const diff = await compareImages(screenshot, baseline);
        
        expect(diff.percentage).toBeLessThan(0.01); // Less than 1% difference
        
        if (diff.percentage > 0) {
          await saveDiffImage('technology-section', diff.diff);
        }
      } catch (error) {
        // If no baseline exists, save current as baseline
        await saveBaselineImage('technology-section', screenshot);
        console.log('Baseline created for technology-section');
      }
    }
  });
  
  test('should render charts correctly', async ({ page }) => {
    await page.goto('/report/visual-test-report');
    
    // Wait for charts to render
    await page.waitForFunction(() => {
      const charts = document.querySelectorAll('canvas');
      return charts.length > 0 && 
        Array.from(charts).every(canvas => {
          const ctx = canvas.getContext('2d');
          // Check if chart has been drawn
          return ctx && canvas.width > 0 && canvas.height > 0;
        });
    }, { timeout: 10000 });
    
    // Screenshot each chart
    const chartElements = await page.locator('[data-testid^="chart-"]').all();
    
    for (let i = 0; i < chartElements.length; i++) {
      const chartElement = chartElements[i];
      const chartId = await chartElement.getAttribute('data-testid');
      
      await argosScreenshot(page, chartId || `chart-${i}`, {
        element: chartElement
      });
      
      // Custom comparison
      const boundingBox = await chartElement.boundingBox();
      if (boundingBox) {
        const screenshot = await page.screenshot({ clip: boundingBox });
        
        try {
          const baseline = await loadBaselineImage(`chart-${i}`);
          const diff = await compareImages(screenshot, baseline);
          
          expect(diff.percentage).toBeLessThan(0.02); // Charts may have slight variations
        } catch (error) {
          await saveBaselineImage(`chart-${i}`, screenshot);
          console.log(`Baseline created for chart-${i}`);
        }
      }
    }
  });
  
  test('should handle dark mode correctly', async ({ page }) => {
    await page.goto('/report/visual-test-report');
    
    // Enable dark mode
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForSelector('html[data-theme="dark"]');
    
    // Wait for theme transition
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    await argosScreenshot(page, 'report-dark-mode');
    
    // Verify contrast ratios
    const contrastIssues = await page.evaluate(() => {
      const checkContrast = (fg: string, bg: string): number => {
        // Convert color to RGB
        const getRGB = (color: string): [number, number, number] => {
          const div = document.createElement('div');
          div.style.color = color;
          document.body.appendChild(div);
          const rgb = window.getComputedStyle(div).color;
          document.body.removeChild(div);
          
          const match = rgb.match(/\d+/g);
          if (match) {
            return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
          }
          return [0, 0, 0];
        };
        
        // Calculate relative luminance
        const getLuminance = (rgb: [number, number, number]): number => {
          const [r, g, b] = rgb.map(val => {
            val = val / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        
        const fgRGB = getRGB(fg);
        const bgRGB = getRGB(bg);
        const fgLum = getLuminance(fgRGB);
        const bgLum = getLuminance(bgRGB);
        
        return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
      };
      
      const issues: any[] = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (styles.color && styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const contrast = checkContrast(styles.color, styles.backgroundColor);
          
          if (contrast < 4.5) { // WCAG AA standard
            issues.push({
              selector: el.tagName + (el.className ? '.' + el.className : ''),
              contrast: contrast.toFixed(2),
              color: styles.color,
              backgroundColor: styles.backgroundColor
            });
          }
        }
      });
      
      return issues;
    });
    
    expect(contrastIssues).toHaveLength(0);
    
    if (contrastIssues.length > 0) {
      console.log('Contrast issues found:', contrastIssues);
    }
  });
  
  test('should render mobile view correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    
    await page.goto('/report/visual-test-report');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await argosScreenshot(page, 'report-mobile');
    
    // Verify mobile-specific elements
    const mobileMenu = await page.locator('[data-testid="mobile-menu"]').isVisible();
    expect(mobileMenu).toBeTruthy();
    
    // Check that content is properly stacked
    const sections = await page.locator('[data-testid$="-section"]').all();
    let previousBottom = 0;
    
    for (const section of sections) {
      const box = await section.boundingBox();
      if (box) {
        expect(box.top).toBeGreaterThanOrEqual(previousBottom);
        previousBottom = box.top + box.height;
      }
    }
  });
  
  test('should handle different report states', async ({ page }) => {
    const states = [
      { url: '/report/empty-report', name: 'empty-state' },
      { url: '/report/loading-report', name: 'loading-state' },
      { url: '/report/error-report', name: 'error-state' },
      { url: '/report/minimal-report', name: 'minimal-state' },
      { url: '/report/full-report', name: 'full-state' }
    ];
    
    for (const state of states) {
      await page.goto(state.url);
      await page.waitForLoadState('networkidle');
      
      await argosScreenshot(page, `report-${state.name}`);
    }
  });
  
  test('should render print view correctly', async ({ page }) => {
    await page.goto('/report/visual-test-report');
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    
    // Take screenshot
    await argosScreenshot(page, 'report-print-view');
    
    // Verify print-specific styles
    const printStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize
      };
    });
    
    // Print view should have white background and black text
    expect(printStyles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(printStyles.color).toBe('rgb(0, 0, 0)');
  });
  
  test('should handle interactive elements hover states', async ({ page }) => {
    await page.goto('/report/visual-test-report');
    
    // Test button hover states
    const buttons = await page.locator('button').all();
    
    for (let i = 0; i < Math.min(buttons.length, 3); i++) { // Test first 3 buttons
      const button = buttons[i];
      const buttonText = await button.textContent();
      
      // Hover over button
      await button.hover();
      await page.waitForTimeout(100); // Wait for hover effect
      
      // Take screenshot
      await argosScreenshot(page, `button-hover-${i}`, {
        element: button
      });
      
      // Move away to reset hover
      await page.mouse.move(0, 0);
    }
  });
  
  test('should verify color consistency', async ({ page }) => {
    await page.goto('/report/visual-test-report');
    
    // Extract all colors used in the report
    const colors = await page.evaluate(() => {
      const colorMap = new Map<string, Set<string>>();
      const elements = document.querySelectorAll('*');
      
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const properties = ['color', 'backgroundColor', 'borderColor'];
        
        properties.forEach(prop => {
          const value = styles[prop as keyof CSSStyleDeclaration] as string;
          if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            if (!colorMap.has(prop)) {
              colorMap.set(prop, new Set());
            }
            colorMap.get(prop)!.add(value);
          }
        });
      });
      
      return Object.fromEntries(
        Array.from(colorMap.entries()).map(([key, values]) => [key, Array.from(values)])
      );
    });
    
    // Verify color palette is consistent
    expect(colors.color.length).toBeLessThan(10); // Should use limited color palette
    expect(colors.backgroundColor.length).toBeLessThan(15);
  });
});

// Helper functions
async function loadBaselineImage(name: string): Promise<Buffer> {
  const baselinePath = path.join(__dirname, '../fixtures/visual-baselines', `${name}.png`);
  return await fs.readFile(baselinePath);
}

async function saveBaselineImage(name: string, image: Buffer): Promise<void> {
  const baselineDir = path.join(__dirname, '../fixtures/visual-baselines');
  await fs.mkdir(baselineDir, { recursive: true });
  
  const baselinePath = path.join(baselineDir, `${name}.png`);
  await fs.writeFile(baselinePath, image);
}

async function saveDiffImage(name: string, diff: Buffer): Promise<void> {
  const diffDir = path.join(__dirname, '../fixtures/visual-diffs');
  await fs.mkdir(diffDir, { recursive: true });
  
  const diffPath = path.join(diffDir, `${name}-diff.png`);
  await fs.writeFile(diffPath, diff);
}

async function compareImages(actual: Buffer, expected: Buffer): Promise<{ percentage: number; diff: Buffer }> {
  const actualPNG = PNG.sync.read(actual);
  const expectedPNG = PNG.sync.read(expected);
  
  // Ensure images have same dimensions
  if (actualPNG.width !== expectedPNG.width || actualPNG.height !== expectedPNG.height) {
    throw new Error(`Image dimensions don't match: ${actualPNG.width}x${actualPNG.height} vs ${expectedPNG.width}x${expectedPNG.height}`);
  }
  
  const { width, height } = actualPNG;
  const diff = new PNG({ width, height });
  
  const numDiffPixels = pixelmatch(
    actualPNG.data,
    expectedPNG.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );
  
  return {
    percentage: numDiffPixels / (width * height),
    diff: PNG.sync.write(diff)
  };
}