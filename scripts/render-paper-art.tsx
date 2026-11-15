import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PaperTownArt } from '../src/components/paper-town';

// Use the same code-authored artwork in the app and the social preview.
process.stdout.write(renderToStaticMarkup(<PaperTownArt/>));
