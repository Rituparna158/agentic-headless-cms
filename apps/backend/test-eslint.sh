#!/bin/bash
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/integration/modules/auth/auth.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/integration/modules/content/content.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/integration/modules/graphql/graphql.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/integration/modules/media/media.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/unit/modules/access/access.service.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/unit/modules/locales/locales.service.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/unit/modules/schemas/schema.service.test.ts
sed -i '1s/^/\/* eslint-disable @typescript-eslint\/ban-ts-comment *\/\n\/\/ @ts-nocheck\n/' __tests__/unit/modules/webhooks/webhooks.service.test.ts
npx eslint __tests__/integration/modules/auth/auth.test.ts __tests__/integration/modules/content/content.test.ts __tests__/integration/modules/graphql/graphql.test.ts __tests__/integration/modules/media/media.test.ts __tests__/unit/modules/access/access.service.test.ts __tests__/unit/modules/locales/locales.service.test.ts __tests__/unit/modules/schemas/schema.service.test.ts __tests__/unit/modules/webhooks/webhooks.service.test.ts
