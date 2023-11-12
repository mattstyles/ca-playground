/** @type {import('next').NextConfig} */
import {createVanillaExtractPlugin} from '@vanilla-extract/next-plugin'
const withVanillaExtract = createVanillaExtractPlugin()

const config = {
  reactStrictMode: true,
  transpilePackages: ['ui'],
}

module.exports = withVanillaExtract(config)
