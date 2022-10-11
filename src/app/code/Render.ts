import fs from 'fs/promises';
import Mustache from 'mustache';

/**
 * Render data in a mustache template
 *
 * @param {object} data An object of data to use in the template
 * @param {string} templatePath the path to the mustache template
 * @returns string
 */
export default async (data: any, templatePath: string, partials: any) => {
  const template = await fs.readFile(templatePath, 'utf8');
  let partialTemplates: {[key: string]: string } = {};
  if (partials) {
    const keys = Object.keys(partials);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const partial = await fs.readFile(partials[key], 'utf8');
      partialTemplates[key] = partial;
    }
  }

  data.name = 'IRMA'; // TODO later veranderen bij naam switch

  return Mustache.render(template.toString(), data, partialTemplates);
};