import sanitizeHtml from 'sanitize-html';


export class SanitizeHTMLContent {
      async cleanTextContent(html: string) {
            let sanitizedText = sanitizeHtml(html, {
                allowedTags: ['b', 'i', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'strong', 'em', ''],
                allowedAttributes: {
                    a: ['href', 'name', 'target'],
                    '*': ['style'],
                },
                disallowedTagsMode: ' ',
                allowedSchemes: ['http', 'https']
            });
    
            sanitizedText = sanitizedText.replace(/\n/g, '<br>');
            sanitizedText = sanitizedText.replace(/[\n\t\r]+/g, ' ');
            sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();
    
            return sanitizedText;
        };
}