---
layout: default
title: KVM tagged articles
tag: kvm
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>

[KVM (Kernel-based Virtual Machine)](https://en.wikipedia.org/wiki/Kernel-based_Virtual_Machine) is a virtualization infrastructure for the Linux kernel that turns it into a hypervisor, which was merged into the [Linux](/tag/linux) kernel mainline in February 2007. KVM requires a processor with hardware virtualization extension. 


{% include tagged_posts_list.html %}

{% include discus.html %}
