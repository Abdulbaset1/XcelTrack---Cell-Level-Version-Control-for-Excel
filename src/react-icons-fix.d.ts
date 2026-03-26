import React from 'react';

declare module 'react' {
    interface ReactElement {
        readonly type: any;
        readonly props: any;
        readonly key: any;
    }
}
