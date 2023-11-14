/** @type {import('next').NextConfig} */
const {createVanillaExtractPlugin} = require('@vanilla-extract/next-plugin')

const withVanillaExtract = createVanillaExtractPlugin()

const config = {
  reactStrictMode: true,
  transpilePackages: ['ui', '@ca/rate-limiter', '@ca/trace'],
}

module.exports = withVanillaExtract(config)
