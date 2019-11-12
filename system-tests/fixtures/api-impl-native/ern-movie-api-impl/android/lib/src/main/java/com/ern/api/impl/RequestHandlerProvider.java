{{>licenseInfo}}

package com.ern.api.impl;

import android.support.annotation.Nullable;

{{>generatedCode}}

abstract class RequestHandlerProvider<T extends RequestHandlerConfig> {
    protected T mRequestHandlerConfig;

    /**
     * @param requestHandlerConfig: Optional config object that can be passed to an api impl provider.
     */
    public RequestHandlerProvider(@Nullable T requestHandlerConfig) {
        mRequestHandlerConfig = requestHandlerConfig;
    }
}
